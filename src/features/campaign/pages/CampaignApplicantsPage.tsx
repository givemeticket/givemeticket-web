import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchX, X } from "lucide-react";
import {
  getCampaign,
  getCampaignApplicants,
  cancelApplicantByOwner,
  type Applicant,
} from "../api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { Avatar } from "@/shared/components/Avatar";
import { IconButton } from "@/shared/components/buttons/IconButton";
import { ConfirmDialog } from "@/shared/components/overlay/ConfirmDialog";
import { CampaignSubPageShell } from "../components/CampaignSubPageShell";
import { FullPageMessage } from "@/shared/components/feedback/FullPageMessage";
import { LoadingFade } from "@/shared/components/feedback/LoadingFade";

// 개설자 전용 — 확정된 신청자를 선착순 순서대로 보여주고, 개별 취소(강제 내보내기)도
// 가능함. shortCode로 캠페인부터 조회해서 진짜 campaignId를 얻은 다음, 그걸로
// 신청자 목록 API를 호출함 (신청자 목록 API 자체는 campaignId 기준이라서).
export function CampaignApplicantsPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const location = useLocation();

  // 상세 페이지에서 "신청자 목록" 아이콘을 클릭해서 들어왔는지 — 뒤로가기
  // 버튼은 항상 보이지만, 이 값에 따라 버튼을 눌렀을 때 어디로 갈지가 갈림
  // (아래 BackButton의 forceFallback 참고). 자세한 이유는 CampaignEditPage.tsx의
  // 같은 패턴 참고.
  const [cameFromDetail] = useState(
    () => (location.state as { fromDetail?: boolean } | null)?.fromDetail,
  );

  const { data: campaign, isLoading: isCampaignLoading } = useQuery({
    queryKey: ["campaign", shortCode],
    queryFn: () => getCampaign(shortCode!),
    enabled: Boolean(shortCode),
  });

  const campaignId = campaign?.id;

  const {
    data: applicantsResult,
    isLoading: isApplicantsLoading,
    refetch,
  } = useQuery({
    queryKey: ["campaignApplicants", campaignId],
    queryFn: () => getCampaignApplicants(campaignId!),
    enabled: Boolean(campaignId),
  });

  const [cancelTarget, setCancelTarget] = useState<Applicant | null>(null);
  const [isActing, setIsActing] = useState(false);

  async function handleConfirmCancel() {
    if (!cancelTarget || !campaignId) return;
    setIsActing(true);
    try {
      await cancelApplicantByOwner(campaignId, cancelTarget.applicationId);
      await refetch();
    } finally {
      setIsActing(false);
      setCancelTarget(null);
    }
  }

  const isLoading = isCampaignLoading || isApplicantsLoading;

  if (!isLoading && !campaign) {
    return (
      <FullPageMessage
        icon={<SearchX size={32} strokeWidth={1.6} />}
        title="행사를 찾을 수 없어요"
        description="주소가 잘못됐거나, 더 이상 존재하지 않는 행사예요."
      />
    );
  }

  const applicants = applicantsResult?.applicants ?? [];

  return (
    <>
      <LoadingFade isLoading={isLoading}>
        {campaign && (
          // 상세에서 클릭해서 들어온 경우엔 실제 뒤로가기(navigate(-1))로, 주소를
          // 직접 입력해서 들어온 경우엔(cameFromDetail이 없음) 엉뚱한 이전
          // 페이지로 가지 않도록 강제로 이 캠페인의 상세 페이지로 보냄.
          <CampaignSubPageShell
            title="신청자 목록"
            backButtonFallback={`/campaigns/${shortCode}`}
            backButtonForceFallback={!cameFromDetail}
          >
            <p className="mt-1 text-sm text-(--muted)">
              {campaign.title} · 총 {applicantsResult?.totalCount ?? 0}명
            </p>

            <div className="mt-6 flex flex-col gap-2">
              {applicants.length === 0 && (
                <p className="py-16 text-center text-sm text-(--muted)">
                  아직 신청자가 없어요.
                </p>
              )}

              {applicants.map((a, idx) => (
                <div
                  key={a.applicationId}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="w-6 shrink-0 text-center text-xs text-(--muted)">
                    {idx + 1}
                  </span>
                  <Avatar src={a.profileImageUrl} name={a.nickname} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {a.nickname}
                    </p>
                    <p className="text-xs text-(--muted)">
                      {formatDateTimeKo(a.appliedAt)} 신청
                    </p>
                  </div>
                  <IconButton
                    onClick={() => setCancelTarget(a)}
                    label="신청 취소"
                    tone="warn"
                  >
                    <X size={16} strokeWidth={2} />
                  </IconButton>
                </div>
              ))}
            </div>
          </CampaignSubPageShell>
        )}
      </LoadingFade>

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="이 신청을 취소할까요?"
        description={
          cancelTarget
            ? `${cancelTarget.nickname}님의 신청이 취소되고, 자리가 다른 사람에게 풀려요.`
            : undefined
        }
        confirmLabel={isActing ? "처리 중..." : "취소하기"}
        danger
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
