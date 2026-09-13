import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Search, SearchX, X } from "lucide-react";
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

  // 검색/정렬 둘 다 서버 API 없이 이미 받아온 목록을 클라이언트에서 그대로
  // 가공함 — 신청자 목록 API가 애초에 전체를 한 번에 다 내려주고(페이지네이션
  // 없음) 검색/정렬 파라미터도 안 받아서, 매 keystroke마다 다시 계산해도
  // 네트워크 왕복이 없어 디바운스 없이 즉시 반영해도 부담이 없음.
  const [searchQuery, setSearchQuery] = useState("");
  // 정렬 기준은 "신청 순" 하나뿐이라 여러 기준을 고르는 InlineSortFilter류
  // 대신 단순 방향 토글만 둠. "asc"가 API가 원래 내려주는 순서(신청 순) 그대로.
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

  // rank는 검색/정렬과 무관하게 "몇 번째로 신청했는지"(선착순 순번)를 항상
  // 그대로 유지해야 해서, 원본(API가 내려준 그대로의) 순서 기준으로 딱 한 번만
  // 매겨둠 — 그 뒤에 필터링/역순 정렬을 적용해도 이 번호 자체는 안 바뀜.
  const rankedApplicants = applicants.map((a, i) => ({ ...a, rank: i + 1 }));
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredApplicants = normalizedQuery
    ? rankedApplicants.filter((a) =>
        a.nickname.toLowerCase().includes(normalizedQuery),
      )
    : rankedApplicants;
  const visibleApplicants =
    sortDirection === "desc"
      ? [...filteredApplicants].reverse()
      : filteredApplicants;

  return (
    <>
      <title>
        {campaign
          ? `신청자 목록: ${campaign.title} - GIVEMETICKET`
          : "GIVEMETICKET"}
      </title>
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
            {/* "총 N명"은 바로 아래 통계 카드(신청 카드)와 내용이 겹쳐서
                모바일/데스크톱 모두에서 없앰 — 검색 중일 때의 결과 수만
                남김. */}
            <p className="mt-1 text-sm text-(--muted)">
              {campaign.title}
              {normalizedQuery && ` · 검색 결과 ${visibleApplicants.length}명`}
            </p>

            {/* 신청/정원 통계 카드 — claude.ai/design Mobile Screens 목업에
                새로 추가된 요소. 이미 갖고 있는 데이터(totalCount, campaign의
                totalStock)로만 채우므로 별도 API 없이 데스크톱/모바일 공통
                적용함. */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div
                className="rounded-[10px] border p-3"
                style={{
                  borderColor: "var(--line)",
                  backgroundColor: "var(--ink-soft)",
                }}
              >
                <p className="text-xs text-(--muted)">신청</p>
                <p className="mt-0.5 text-lg font-extrabold text-(--paper)">
                  {applicantsResult?.totalCount ?? 0}명
                </p>
              </div>
              <div
                className="rounded-[10px] border p-3"
                style={{
                  borderColor: "var(--line)",
                  backgroundColor: "var(--ink-soft)",
                }}
              >
                <p className="text-xs text-(--muted)">정원</p>
                <p className="mt-0.5 text-lg font-extrabold text-(--paper)">
                  {campaign.totalStock != null
                    ? `${campaign.totalStock}명`
                    : "-"}
                </p>
              </div>
            </div>

            {applicants.length > 0 && (
              <div className="mt-4 flex items-center gap-2">
                <IconButton
                  size="sm"
                  onClick={() =>
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  label="정렬 순서 변경"
                  active={sortDirection === "desc"}
                  align="left"
                >
                  <ArrowUpDown size={16} strokeWidth={2} />
                </IconButton>
                {/* 모바일에서는 남는 폭을 다 차지하도록(flex-1) — 데스크톱
                    고정폭(w-48)은 sm: 이상에서만 적용 */}
                <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
                  <Search
                    size={15}
                    strokeWidth={2}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--muted)"
                  />
                  {/* .input의 padding: 0.75rem 1rem이 Tailwind 유틸리티 레이어보다
                      우선순위가 높아서(레이어 밖 커스텀 CSS라 @layer utilities 안의
                      pl-9/py-1.5 같은 클래스보다 항상 이김), 왼쪽 여백(아이콘과
                      안 겹치게)과 위아래 여백(버튼과 높이를 맞추려고 살짝 줄임)
                      둘 다 클래스 대신 인라인 style로 직접 줌. */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="닉네임으로 검색"
                    className="input w-full"
                    style={{
                      paddingLeft: "2.25rem",
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem",
                    }}
                  />
                </div>
              </div>
            )}

            {/* 한 줄에 3개씩(데스크톱) — 페이지 폭이 넓어지면서
                (CampaignSubPageShell.tsx 880px) 세로 1열로는 옆 여백이 너무
                커 보여서 그리드로 바꿈. 모바일(640px 미만)은 1열. 빈 상태
                문구는 그리드 아이템 하나가 아니라 전체 폭을 가로질러 보여야
                해서 col-span-full을 따로 줌. */}
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {applicants.length === 0 && (
                <p className="col-span-full py-16 text-center text-sm text-(--muted)">
                  아직 신청자가 없어요.
                </p>
              )}

              {applicants.length > 0 && visibleApplicants.length === 0 && (
                <p className="col-span-full py-16 text-center text-sm text-(--muted)">
                  검색 결과가 없어요.
                </p>
              )}

              {visibleApplicants.map((a) => (
                <div
                  key={a.applicationId}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="w-6 shrink-0 text-center text-xs text-(--muted)">
                    {a.rank}
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
