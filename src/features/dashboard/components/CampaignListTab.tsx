import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Archive, Plus } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { LoadingFade } from "@/shared/components/LoadingFade";
import { InlineSortFilter } from "@/shared/components/InlineSortFilter";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import {
  listCampaigns,
  type CampaignScope,
} from "@/features/campaign/api/campaignApi";
import { getCampaignCardLayoutId } from "@/features/campaign/lib/campaignCardLayoutId";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { FadeSlide } from "@/shared/animation/components/FadeSlide";
import { consumePendingScrollOffset } from "@/shared/animation/pageTransition/scrollOffsetStore";
import { consumeReturningCampaignId } from "@/shared/animation/pageTransition/returningCardStore";
import { POST_ANIMATION_DELAY_MS } from "@/shared/animation/animationDurations";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import type { FilterTab } from "../lib/dashboardFilterStore";

interface CampaignListTabProps {
  /** owned="내가 만든 행사", participated="나의 티켓" */
  scope: CampaignScope;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyDescription: string;
  /** 상세 페이지 이동 시 state.from으로 실어 보내는 값 — 뒤로가기 버튼 표시/목적지 판단용.
   * dashboardFilterStore의 FilterTab이랑 값이 똑같아서(mycampaigns/mytickets), 정렬 상태
   * 저장소 키로도 그대로 재사용함 */
  fromKey: FilterTab;
  sortOptions: { value: string; label: string }[];
}

// "나의 티켓" / "나의 행사" 두 탭이 겉보기엔 다른 목록이지만, 내부 로직(카드
// 렌더링/이동 애니메이션/필터링/정렬)이 완전히 동일해서 하나로 합침. 다른 건
// API scope, 빈 상태 문구, 정렬 옵션, 상세 이동 시 실어 보내는 출처 키뿐임.
//
// 필터/행사추가 버튼도 예전엔 DashboardLayout이 들고 있었는데(탭 전환 시 안 흔들리게
// 하려고), 탭 전환 자체가 애니메이션 없이 순간적으로 바뀌도록 이미 되어있어서
// (AppRouter.tsx의 getAnimationKey) 그 우려가 실익이 없었음. 정렬 상태도 이미
// dashboardFilterStore(모듈 메모리)에 저장되니 이 컴포넌트가 마운트를 새로 해도
// 값 자체는 안 사라짐 — 여기로 옮기는 게 더 응집도 높은 구조라 이전함.
export function CampaignListTab({
  scope,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  fromKey,
  sortOptions,
}: CampaignListTabProps) {
  const navigate = useNavigate();

  // 상세 페이지에서 뒤로가기로 돌아온 경우, 그 클릭 시점에 계산해둔 역방향 오프셋값이
  // 여기 담겨있음(없으면 null — 다른 경로로 들어온 경우). 마운트 시점에 한 번만 소비함.
  const [pendingScrollOffset] = useState(() => consumePendingScrollOffset());
  const [isScrollOffsetActive, setIsScrollOffsetActive] = useState(
    pendingScrollOffset !== null,
  );
  // 오프셋을 없애는 그 순간, 돌아온 카드의 이동 duration을 0으로 강제해서 즉시
  // 반영되게 함 — 안 그러면 오프셋 제거로 카드 측정 위치가 바뀌는 걸 Framer
  // Motion이 "또 다른 이동"으로 착각해서, 의도치 않은 두 번째 애니메이션을
  // 자체적으로 걸어버리는 문제가 있었음(CampaignDetailPage에서 로그로 확인한
  // 것과 같은 원인, 여기도 대칭으로 적용함).
  const [hasSnappedScrollOffset, setHasSnappedScrollOffset] = useState(false);

  useEffect(() => {
    if (pendingScrollOffset === null) return;
    // 카드 이동 + 페이지 페이드가 전부 통일된 duration이라, 그 시간만큼만
    // 기다리면 됨(여유분 조금 추가). 오프셋 제거랑 동시에 진짜 스크롤을 이 목록의
    // 저장된 목표값으로 맞춤 — 정확히 같은 타이밍이어야 시각적 어긋남이 없음.
    const timer = setTimeout(() => {
      // window.scrollTo는 즉시 반영되는데, 오프셋 제거(state 변경)는 리액트의
      // 다음 렌더링까지 기다림 — flushSync로 오프셋 제거를 먼저 동기적으로 완전히
      // 끝내고, 그 다음에 스크롤을 바꿔서 시각적으로 어긋나는 틈이 안 생기게 함.
      flushSync(() => {
        setIsScrollOffsetActive(false);
        setHasSnappedScrollOffset(true);
      });
      const nextScrollY = window.scrollY - pendingScrollOffset;
      window.scrollTo(0, nextScrollY);
    }, POST_ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    sortBy,
    sortDirection,
    showExpiredOnly,
    setSortBy,
    setSortDirection,
    setShowExpiredOnly,
  } = useDashboardFilters(fromKey);
  // "지금 이동 중인 카드가 뭔지" 하나만 추적. 상세 페이지에서 인앱 뒤로가기
  // 버튼으로 돌아온 경우, 그 클릭 시점에 표시해둔 값을 여기서 이어받아 그
  // 카드에도 이동 애니메이션을 걸어줌(returningCardStore.ts, 한 번 읽으면
  // 소모됨). 그 외(새로 클릭, 새로고침, 브라우저 자체 뒤로/앞으로가기 등)엔
  // 값이 없어서 null로 시작하고, 클릭할 때마다 그때그때 덮어씀.
  const [transitioningId, setTransitioningId] = useState<number | null>(
    () => consumeReturningCampaignId(),
  );

  // onMoveComplete에서 transitioningId를 리셋할 때 쓸 지연 타이머. 카드가 도착한
  // 즉시 리셋하면, 그 순간 아직 화면에 남아있는 주변 페이지(예: 방금 떠나온 상세
  // 페이지)의 4초짜리 페이드가 덜 끝난 상태라 이 카드의 애니메이션 prop이 갑자기
  // 바뀌면서 깜빡이는 버그가 있었음. 그래서 주변 페이드가 확실히 다 끝날 시점까지
  // 리셋을 늦춤. 반대로 아예 리셋을 안 하면(이전 시도), 이 카드가 "이동 중" 상태로
  // 계속 남아있다가 카드 없는 화면(행사 추가 등)으로 넘어갈 때 짝을 못 찾고
  // 방치되는 버그가 있었음 — 그래서 "늦게라도 리셋은 하는" 이 방식으로 절충함.
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["campaigns", scope],
    queryFn: () => listCampaigns(scope),
  });

  function renderBody() {
    if (!campaigns || campaigns.length === 0) {
      return (
        <FadeSlide>
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </FadeSlide>
      );
    }

    // 꺼짐(기본): 만료(삭제됨/종료됨)된 행사를 숨김. 켜짐: 반대로 만료된 행사만 보여주고
    // 나머지(예정/진행중)는 숨김 — "만료된 것만 따로 걸러보는" 필터라 두 상태가 서로 배타적임
    const visibleCampaigns = showExpiredOnly
      ? campaigns.filter((c) => c.status === "DELETED" || c.status === "CLOSED")
      : campaigns.filter(
          (c) => c.status !== "DELETED" && c.status !== "CLOSED",
        );

    // "신청 날짜"/"만든 날짜"는 서버가 이미 내림차순(최신순)으로 내려주고 있어서,
    // 오름차순으로 바꿀 땐 실제 날짜값 없이도 그 배열을 그대로 뒤집기만 하면 정확한
    // 결과가 나옴. "오픈 날짜"만 openAt 값으로 직접 정렬함 — 목록 응답에 이미 포함돼
    // 있어서 별도 API 없이 바로 정렬 가능.
    if (sortBy === "openAt") {
      visibleCampaigns.sort((a, b) => {
        const diff =
          new Date(a.openAt).getTime() - new Date(b.openAt).getTime();
        return sortDirection === "asc" ? diff : -diff;
      });
    } else if (sortDirection === "asc") {
      visibleCampaigns.reverse();
    }

    if (visibleCampaigns.length === 0) {
      return (
        <FadeSlide>
          {showExpiredOnly ? (
            <EmptyState
              icon={<Archive size={22} strokeWidth={1.7} />}
              title="만료된 행사가 없어요"
              description="삭제되거나 종료된 행사가 여기 모여요"
            />
          ) : (
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          )}
        </FadeSlide>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {visibleCampaigns.map((c) => {
          const isTransitioning = c.id === transitioningId;
          const card = (
            <CampaignCard
              title={c.title}
              status={c.status}
              soldOut={c.soldOut ?? false}
              openAtLabel={`${formatDateTimeKo(c.openAt)} 오픈`}
              remainingStock={
                c.totalStock != null && c.remainingStock != null
                  ? c.remainingStock
                  : undefined
              }
              totalStock={c.totalStock ?? undefined}
              ownerNickname={c.owner.nickname}
              ownerProfileImageUrl={c.owner.profileImageUrl}
              imageUrl={c.imageUrl}
              // layoutId는 항상(예외 없이) 줌 — Framer Motion이 기준점을 미리 알고
              // 있어야 하기 때문. 실제로 이동해야 하는 카드인지는 animateMove로만
              // 구분함. 마운트 시점에 한 번 결정하고 이후 절대 안 바꾸는 게 원칙인데
              // (animation.md 1번), "항상 켜짐"은 그 자체로 이미 이 원칙에 안전하게
              // 부합함.
              layoutId={getCampaignCardLayoutId(c.id)}
              animateMove={isTransitioning}
              layoutDurationOverride={
                isTransitioning && hasSnappedScrollOffset ? 0 : undefined
              }
              onMoveComplete={() => {
                if (resetTimeoutRef.current)
                  clearTimeout(resetTimeoutRef.current);
                // 카드 애니메이션이 끝난 즉시 리셋하면, 주변 페이지의 페이드가 아직
                // 안 끝난 상태에서 카드 애니메이션 prop이 갑자기 바뀌며 깜빡이는
                // 문제가 있었음. POST_ANIMATION_DELAY_MS(애니메이션 지속시간 +
                // 여유분)만큼 기다린 뒤 리셋함 — animationDurations.ts 참고.
                resetTimeoutRef.current = setTimeout(() => {
                  setTransitioningId(null);
                }, POST_ANIMATION_DELAY_MS);
              }}
              onClick={() => {
                // setTransitioningId만 하고 바로 navigate하면, 그 상태 변경이 화면에
                // 실제로 반영되기 전에 라우터 전환이 먼저 처리돼버릴 수 있음(navigate가
                // 더 빠름). flushSync로 반영을 강제로 먼저 끝내고 넘어감.
                if (resetTimeoutRef.current)
                  clearTimeout(resetTimeoutRef.current);
                flushSync(() => {
                  setTransitioningId(c.id);
                });
                // 스크롤 오프셋 보정은 이제 RootLayout(UserApp.tsx)이 모든
                // 목록↔상세 전환에서 일괄적으로 계산해줌 — 여기서 따로 표시해둘
                // 필요 없음.
                navigate(`/campaigns/${c.shortCode}`, {
                  state: { from: fromKey, campaign: c },
                });
              }}
            />
          );

          // 이동 중인 카드는 페이드 관련 prop 없이(=순수 이동만), 나머지는 페이드
          // prop을 줌. 예전엔 이동 중일 때 <div>, 아닐 때 <motion.div>로 아예
          // 다른 요소 타입을 썼는데, 같은 key라도 타입이 바뀌면 리액트가 업데이트
          // 대신 언마운트 후 재마운트를 해버려서(A→뒤로가기→B 클릭 시 A 카드가
          // 애니메이션 없이 순간 사라졌다 나타나던 버그의 원인). FadeSlide는 항상
          // motion.div로 통일하고 disabled일 때만 페이드 prop을 안 줘서, 리액트가
          // "업데이트"로 처리하게 함.
          return (
            <FadeSlide key={c.id} disabled={isTransitioning}>
              {card}
            </FadeSlide>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
      style={
        isScrollOffsetActive && pendingScrollOffset !== null
          ? { transform: `translateY(${pendingScrollOffset}px)` }
          : undefined
      }
    >
      <FadeSlide className="flex items-center justify-between">
        <InlineSortFilter
          sortOptions={sortOptions}
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          showExpiredOnly={showExpiredOnly}
          onShowExpiredOnlyChange={setShowExpiredOnly}
        />

        {scope === "owned" && (
          <button
            type="button"
            onClick={() => navigate("/campaigns/create")}
            className="flex items-center gap-1 rounded-full px-4 py-2 text-[13px] font-semibold text-(--on-yellow) shadow-[0_2px_8px_rgba(17,24,39,0.15)] transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{ backgroundColor: "var(--brand-yellow)" }}
          >
            <Plus size={15} strokeWidth={2.5} />
            행사 추가
          </button>
        )}
      </FadeSlide>

      <LoadingFade isLoading={isLoading}>{renderBody()}</LoadingFade>
    </div>
  );
}
