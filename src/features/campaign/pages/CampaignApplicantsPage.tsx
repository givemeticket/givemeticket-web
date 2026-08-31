import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import {
  getCampaign,
  getCampaignApplicants,
  cancelApplicantByOwner,
  type Applicant,
} from "../api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { BackButton } from "@/shared/components/BackButton";
import { Avatar } from "@/shared/components/Avatar";
import { IconButton } from "@/shared/components/IconButton";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { AnimatedPageBackground } from "@/shared/components/AnimatedPageBackground";
import { clearTransitioningCampaign } from "../lib/transitioningCampaignStore";

// 개설자 전용 — 확정된 신청자를 선착순 순서대로 보여주고, 개별 취소(강제 내보내기)도
// 가능함. shortCode로 캠페인부터 조회해서 진짜 campaignId를 얻은 다음, 그걸로
// 신청자 목록 API를 호출함 (신청자 목록 API 자체는 campaignId 기준이라서).
export function CampaignApplicantsPage() {
  const { shortCode } = useParams<{ shortCode: string }>();

  // 마운트될 때마다 저장소를 비움 — 이 화면엔 캠페인 카드 자체가 없어서, 예전
  // 상세 페이지 방문 때 저장된 값이 여기를 거쳐 목록으로 돌아갈 때까지 계속 남아있다가
  // 엉뚱하게 소비되며 짝 없는 카드가 잠깐 나타났다 사라지는 문제가 있었음.
  useEffect(() => {
    clearTransitioningCampaign();
  }, []);

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

  if (isCampaignLoading || isApplicantsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--ink) text-(--paper)">
        불러오는 중...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--ink) text-(--paper)">
        행사를 찾을 수 없어요.
      </div>
    );
  }

  const applicants = applicantsResult?.applicants ?? [];

  return (
    <>
      <AnimatedPageBackground>
        <div className="mx-auto max-w-2xl px-6 pt-8 pb-10">
          <div className="flex items-center gap-1">
            <BackButton fallback={`/campaigns/${shortCode}`} />
            <h1 className="text-lg font-bold">신청자 목록</h1>
          </div>
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
                  <p className="truncate text-sm font-medium">{a.nickname}</p>
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
        </div>
      </AnimatedPageBackground>

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
