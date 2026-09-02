import { useState, type SubmitEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  getCampaign,
  updateCampaign,
  type CampaignDetail,
} from "../api/campaignApi";
import { CampaignFormFields } from "../components/CampaignFormFields";
import { isoToDatetimeLocalValue } from "@/shared/lib/formatDate";
import { BackButton } from "@/shared/components/BackButton";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { AnimatedPageBackground } from "@/shared/components/AnimatedPageBackground";
import { FullPageMessage } from "@/shared/components/FullPageMessage";
import { LoadingFade } from "@/shared/components/LoadingFade";
import { SearchX } from "lucide-react";

// "행사 추가"(CampaignCreatePage)랑 같은 페이지 구조 — 예전엔 상세 페이지 안에
// 인라인으로 펼쳐지는 폼(OwnerPanel)이었는데, 별도 페이지로 분리함.
export function CampaignEditPage() {
  const { shortCode } = useParams<{ shortCode: string }>();

  const {
    data: campaign,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["campaign", shortCode],
    queryFn: () => getCampaign(shortCode!),
    enabled: Boolean(shortCode),
  });

  if (isError || (!isLoading && !campaign)) {
    return (
      <FullPageMessage
        icon={<SearchX size={32} strokeWidth={1.6} />}
        title="행사를 찾을 수 없어요"
        description="주소가 잘못됐거나, 더 이상 존재하지 않는 행사예요."
      />
    );
  }

  return (
    <LoadingFade isLoading={isLoading}>
      {campaign && <CampaignEditForm campaign={campaign} />}
    </LoadingFade>
  );
}

function CampaignEditForm({ campaign }: { campaign: CampaignDetail }) {
  const navigate = useNavigate();
  const location = useLocation();

  // 상세 페이지에서 "수정" 아이콘을 클릭해서 들어왔는지 — 뒤로가기 버튼은
  // 항상 보이지만, 이 값에 따라 버튼을 눌렀을 때 어디로 갈지가 갈림(아래
  // BackButton의 forceFallback 참고). 마운트 시점에 한 번만 고정해두는 이유는
  // CampaignDetailPage의 cameFrom과 동일(뒤로가기 exit 애니메이션 중 라우터
  // state가 먼저 바뀌어버려서 판단이 틀어지는 문제 방지).
  const [cameFromDetail] = useState(
    () => (location.state as { fromDetail?: boolean } | null)?.fromDetail,
  );

  const [title, setTitle] = useState(campaign.title);
  const [totalStock, setTotalStock] = useState(
    campaign.totalStock != null ? String(campaign.totalStock) : "",
  );
  const [openAt, setOpenAt] = useState(() =>
    isoToDatetimeLocalValue(campaign.openAt),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isOpen = campaign.status === "OPEN";
  const isFormValid = title.trim().length > 0;

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await updateCampaign(campaign.id, {
        title: title.trim(),
        openAt: new Date(openAt).toISOString(),
        totalStock: totalStock ? Number(totalStock) : undefined,
      });
      // 새 히스토리 항목을 만드는 대신, navigate(-1)로 원래 있던 상세 페이지
      // 항목으로 그냥 돌아감. replace로 새로 만들면 그 밑에 원래 상세 페이지
      // 항목이 그대로 남아있어서, 뒤로가기를 두 번 눌러야 목록으로 가는 문제가 있었음.
      // 원래 항목으로 돌아가는 거라 그 항목의 state(뒤로가기 버튼 판단용 from 값
      // 등)도 자동으로 그대로 살아남 — 따로 안 실어날라도 됨.
      navigate(-1);
    } catch (e) {
      const code = axios.isAxiosError(e)
        ? (e.response?.data as { code?: string })?.code
        : undefined;
      // OPEN_AT_NOT_FUTURE(단순히 현재 시각보다 이전)랑 OPEN_AT_NOT_DELAYABLE(이미
      // 오픈된 상태에서 원래 오픈 시각보다 이전으로 되돌리려 함) 둘 다, 공통적으로
      // "요청한 시각이 허용된 최소 시각보다 이전"이라는 같은 문제라 같은 메시지로 처리함
      if (code === "OPEN_AT_NOT_FUTURE" || code === "OPEN_AT_NOT_DELAYABLE") {
        setErrorMessage(
          "오픈 시각은 기존 설정 유지 또는 미래로만 설정할 수 있어요.",
        );
      } else if (code === "TOTAL_STOCK_NOT_INCREASABLE") {
        setErrorMessage(
          "이미 오픈된 캠페인은 정원을 줄일 수 없어요. 그대로 두거나 늘리는 것만 가능해요.",
        );
      } else if (code === "CAMPAIGN_CLOSED") {
        setErrorMessage("종료된 캠페인은 오픈 시각을 바꿀 수 없어요.");
      } else {
        setErrorMessage("수정 중 문제가 발생했어요.");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatedPageBackground>
      <div className="mx-auto max-w-2xl px-6 pt-8 pb-10">
        <div className="flex items-center gap-1">
          {/* 상세에서 클릭해서 들어온 경우엔 실제 뒤로가기(navigate(-1))로,
              주소를 직접 입력해서 들어온 경우엔(cameFromDetail이 없음)
              엉뚱한 이전 페이지(새 탭의 이전 방문 기록 등)로 가지 않도록
              강제로 이 캠페인의 상세 페이지로 보냄. */}
          <BackButton
            fallback={`/campaigns/${campaign.shortCode}`}
            forceFallback={!cameFromDetail}
          />
          <h1 className="text-lg font-bold">행사 수정</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-6 rounded-2xl border p-6"
          style={{ borderColor: "var(--line)" }}
        >
          <CampaignFormFields
            title={title}
            onTitleChange={setTitle}
            totalStock={totalStock}
            onTotalStockChange={setTotalStock}
            totalStockMin={isOpen ? (campaign.totalStock ?? 1) : 1}
            totalStockInfo={
              isOpen ? "정원 유지 또는 증원만 가능합니다." : undefined
            }
            openAt={openAt}
            onOpenAtChange={setOpenAt}
            // 이미 오픈된 캠페인은 원래 오픈 시각(이미 지난 시각일 수 있음)을 그대로
            // 유지하는 것도 허용해야 해서, 오늘이 아니라 원래 오픈 시각을 기준으로 함
            openAtMinDate={isOpen ? new Date(campaign.openAt) : undefined}
            openAtResetToNowOnOpen={isOpen}
            openAtOriginalValue={isoToDatetimeLocalValue(campaign.openAt)}
            openAtInfo={
              isOpen ? "오픈 시각 유지 또는 미래만 가능합니다." : undefined
            }
          />

          {errorMessage && (
            <p className="text-xs text-(--warn)">{errorMessage}</p>
          )}

          <div className="self-end">
            <PrimaryButton
              type="submit"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </AnimatedPageBackground>
  );
}
