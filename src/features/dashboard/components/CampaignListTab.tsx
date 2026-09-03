import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Archive, Plus } from "lucide-react";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { LoadingFade } from "@/shared/components/feedback/LoadingFade";
import { InlineSortFilter } from "./InlineSortFilter";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import {
  listCampaigns,
  type CampaignScope,
} from "@/features/campaign/api/campaignApi";
import { getCampaignCardLayoutId } from "@/features/campaign/lib/campaignCardLayoutId";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { FadeSlide } from "@/shared/animation/components/FadeSlide";
import { useScrollOffsetSnap } from "@/shared/animation/pageTransition/useScrollOffsetSnap";
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

  // 상세 페이지에서 뒤로가기로 돌아온 경우, 그 클릭 시점에 계산해둔 역방향
  // 오프셋값을 여기서 소비하고, 애니메이션이 끝나면 오프셋을 없애면서 실제
  // 스크롤을 이 목록의 저장된 목표값(현재 스크롤에서 오프셋만큼 뺀 값)으로
  // 맞춤(useScrollOffsetSnap.ts — CampaignDetailPage.tsx와 공유하는 로직).
  const { pendingScrollOffset, isScrollOffsetActive, hasSnappedScrollOffset } =
    useScrollOffsetSnap((offset) => window.scrollY - offset);

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

  // "이동 중" 카드를 다시 일반 카드로 되돌리는 지연 타이머. 이동 애니메이션이
  // 끝나는 시점(예전엔 onLayoutAnimationComplete)이 아니라, 애니메이션이
  // 실제로 시작되는 시점(=이 컴포넌트가 "이동 중" 카드를 이미 갖고 마운트되는
  // 시점)을 기준으로 걺 — useScrollOffsetSnap.ts와 같은 패턴("duration+100ms
  // 버퍼는 항상 시작 시점 기준"). 예전엔 종료 시점에 이 버퍼를 또 더해서,
  // 실질적으로 시작부터 거의 두 배(duration + duration+100ms)를 기다리게
  // 됐었고, 그 사이 카드 없는 화면(행사 추가 등)으로 넘어가면 이 카드가 여전히
  // "이동 중"(layoutId 유지 + 페이드 없음) 상태로 방치되는 버그로 실제 재현됨.
  //
  // 즉시 리셋(버퍼 없이)하지 않는 이유는 그대로 유지: 아직 화면에 남아있는
  // 주변 요소(헤더/필터줄/다른 카드 등)의 페이드가 다 안 끝난 상태에서 이
  // 카드의 애니메이션 prop이 갑자기 바뀌며 깜빡이는 문제가 있었음. 반대로 아예
  // 리셋을 안 하면(더 예전 시도), 카드 없는 화면으로 넘어갈 때 짝을 못 찾고
  // 방치되는 문제가 있었음 — 그래서 "시작 시점 기준으로 한 번만 버퍼를 두고
  // 리셋"하는 지금 방식으로 절충함.
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (transitioningId !== null) {
      resetTimeoutRef.current = setTimeout(() => {
        setTransitioningId(null);
      }, POST_ANIMATION_DELAY_MS);
    }
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
    // 마운트 시점의 초기값 기준으로 딱 한 번만 예약함 — 이후 onClick으로
    // transitioningId가 바뀌는 경로는 곧 페이지 자체가 언마운트되어 이 타이머가
    // 필요 없음(아래 onClick 참고).
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
