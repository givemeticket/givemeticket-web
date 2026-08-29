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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--ink) text-(--paper)">
        불러오는 중...
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--ink) text-(--paper)">
        행사를 찾을 수 없어요.
      </div>
    );
  }

  return <CampaignEditForm campaign={campaign} />;
}

function CampaignEditForm({ campaign }: { campaign: CampaignDetail }) {
  const navigate = useNavigate();
  const location = useLocation();
  // OwnerPanel의 "수정" 아이콘이 이 페이지로 넘어올 때 실어보낸 값 — 저장 후 상세
  // 페이지로 돌아갈 때도 그대로 다시 실어보내야, 그쪽의 뒤로가기 버튼이 계속 보임
  const cameFrom = (location.state as { from?: string } | null)?.from;

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
      navigate(`/campaigns/${campaign.shortCode}`, {
        replace: true,
        state: { from: cameFrom },
      });
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
    <div className="min-h-screen bg-(--ink) py-10 text-(--paper)">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex items-center gap-1">
          <BackButton fallback={`/campaigns/${campaign.shortCode}`} />
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
    </div>
  );
}
