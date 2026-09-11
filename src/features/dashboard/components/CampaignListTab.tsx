import { useState, useSyncExternalStore, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
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
import { getCampaignCardBackground } from "@/features/campaign/lib/campaignCardBackground";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { PAGE_TRANSITION_DURATION } from "@/shared/animation/animationDurations";
import { FadeSlide } from "@/shared/animation/components/FadeSlide";
import { useScrollOffsetSnap } from "@/shared/animation/pageTransition/useScrollOffsetSnap";
import { consumeReturningCampaignId } from "@/shared/animation/pageTransition/returningCardStore";
import {
  getIsPageTransitioning,
  subscribeToPageTransition,
} from "@/shared/animation/pageTransition/pageTransitionStore";
import { useDashboardFilters } from "../hooks/useDashboardFilters";
import type { FilterTab } from "../lib/dashboardFilterStore";

interface CampaignListTabProps {
  /** owned="내가 만든 행사", participated="나의 티켓" */
  scope: CampaignScope;
  /** 페이지 상단에 큼직하게 보여주는 제목("나의 티켓"/"나의 행사"). 헤더의
   * 탭(HeaderTabs.tsx)엔 활성 표시가 없어서, "지금 어느 목록을 보고 있는지"를
   * 여기서 대신 알려줌 */
  pageTitle: string;
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
  pageTitle,
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

  // "이동 중" 카드를 다시 일반 카드로 되돌리는 시점 — 로컬 타이머로 직접
  // 재는 대신, 전역 페이지 전환 신호(pageTransitionStore.ts)가 꺼지는 순간을
  // 그대로 씀. 이 신호는 RootLayout이 실제 라우트 전환을 감지할 때마다
  // duration+100ms 뒤 자동으로 꺼지는데, 예전엔 이 계산을 여기서도 로컬
  // 타이머로 따로 다시 하고 있었음(그것도 시작이 아니라 "카드 이동 애니메이션이
  // 끝나는 시점" 기준으로 걸어서, 실질적으로 거의 두 배를 기다리게 되는 버그로
  // 이어짐 — 실제 재현 확인함). "이 페이지 전환이 완전히 끝났는지"를 판단하는
  // 로직은 이미 pageTransitionStore 한 곳에 있으니 그걸 구독하는 게 맞음
  // (UserAppShell.tsx가 클릭 차단에 쓰는 것과 같은 패턴).
  const isPageTransitioning = useSyncExternalStore(
    subscribeToPageTransition,
    getIsPageTransitioning,
  );
  // isPageTransitioning은 "지금 이 순간 전환 중인지"만 알려줄 뿐, 그게
  // true였다가 false로 돌아온 것(=이번 전환이 끝난 것)인지 아니면 애초에
  // 아직 안 켜진 것인지는 구분을 안 해줌. 실제로 로그를 찍어보니, 이
  // 컴포넌트가 마운트된 뒤 가장 먼저 도는 렌더링/이펙트조차
  // RootLayout(부모)의 beginPageTransition() 호출보다 먼저 실행되는 경우가
  // 있어서(effect든 렌더링 중 비교든 둘 다 겪음 — 실제 재현 확인함), "지금
  // false면 무조건 리셋"은 두 방식 다 안전하지 않았음. 그래서 "한 번이라도
  // true를 본 적 있는지"를 별도 state로 기억해두고, "true였다가 지금
  // false"인 진짜 종료 시점에만 리셋함 — 이건 이번 렌더링에서 이미 알고
  // 있는 값들(isPageTransitioning, hasSeenTransitionStart)끼리의 비교라,
  // 앞서 겪은 두 경쟁 문제 모두와 무관함.
  const [hasSeenTransitionStart, setHasSeenTransitionStart] = useState(false);
  if (isPageTransitioning && !hasSeenTransitionStart) {
    setHasSeenTransitionStart(true);
  }
  if (
    !isPageTransitioning &&
    hasSeenTransitionStart &&
    transitioningId !== null
  ) {
    setTransitioningId(null);
  }

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
      // 예전엔 세로 1열 목록(flex-col)이었는데, 스퀘어 티켓 카드로 리디자인하며
      // 그리드로 바꿈. 트랙 폭을 고정(264px)한 이유: 카드가 목록/상세 어디서든
      // 완전히 같은 크기여야 한다는 요구사항 때문 — minmax(240px,1fr) 같은
      // 신축 트랙을 쓰면 넓은 화면에서 카드가 264px보다 커져버려서 상세 페이지
      // 카드와 크기가 달라짐(그러면 layoutId 전환 때 확대/축소가 생김). 대가로
      // 컬럼 수가 안 맞아떨어지는 만큼의 공간은 그냥 행 끝에 빈 여백으로 남음.
      // justify-center: DashboardLayout.tsx의 컨테이너 폭을 3열 정확히 꽉
      // 채우는 값(880px)으로 맞춰뒀지만, 그건 "정확히 3개 이상"일 때 얘기고
      // 행사가 1~2개뿐이면 auto-fill이 만든 3개 트랙 중 일부가 비어서 카드가
      // 왼쪽으로 쏠려 보임 — justify-center로 실제 채워진 트랙들을 가운데
      // 정렬해서 이 경우에도 자연스럽게 보이게 함.
      <div className="grid grid-cols-[repeat(auto-fill,264px)] justify-center gap-5">
        {visibleCampaigns.map((c) => {
          const isTransitioning = c.id === transitioningId;
          const isDeleted = c.status === "DELETED";
          // layoutId는 항상(예외 없이) 줌 — Framer Motion이 기준점을 미리 알고
          // 있어야 하기 때문. 실제로 이동해야 하는 카드인지는 아래 duration
          // 계산으로만 구분함. 마운트 시점에 한 번 결정하고 이후 절대 안 바꾸는
          // 게 원칙인데(animation.md 1번), "항상 켜짐"은 그 자체로 이미 이
          // 원칙에 안전하게 부합함.
          //
          // 위치/크기 이동 애니메이션(layout)의 기본값은 스프링(물리 기반)이라,
          // 감쇠가 부족하면 목표 지점을 지나쳤다가 되돌아오는 튕김 현상이 생김.
          // duration 기반 easing으로 명시적으로 바꿔서 한 번에 부드럽게
          // 도착하도록 함. 실제로 이동해야 하는 카드(isTransitioning)만 정해진
          // duration, 나머지(옆 카드가 빠지면서 자리가 밀리기만 하는 카드)는
          // 0초 — 안 그러면 밀리는 것까지 다 슬라이드 애니메이션이 걸려서
          // 지저분해짐. 스크롤 오프셋 보정(scrollOffsetStore.ts)에서 오프셋을
          // 없애는 순간엔, 카드의 측정 위치가 바뀌는 걸 Framer Motion이 "또
          // 다른 이동"으로 착각해서 자체적으로 두 번째 애니메이션을 걸어버리는
          // 문제가 있어서, 그 순간만 0으로 강제함(hasSnappedScrollOffset).
          const listLayoutDuration =
            isTransitioning && hasSnappedScrollOffset
              ? 0
              : isTransitioning
                ? PAGE_TRANSITION_DURATION
                : 0;
          const card = (
            <motion.button
              layoutId={getCampaignCardLayoutId(c.id)}
              transition={{
                layout: { duration: listLayoutDuration, ease: "easeInOut" as const },
              }}
              // CSS transition-transform 대신 Framer Motion 자체의
              // whileHover/whileTap을 씀 — CSS 트랜지션이 transform을 건드리면,
              // layoutId 이동 애니메이션이 매 프레임 만들어내는 transform 값을
              // CSS가 또 한 번 따로 부드럽게 쫓아가려고 해서, 두 시스템이 같은
              // 속성을 동시에 조작하며 충돌함(카드가 두 개로 보이던 원인).
              whileHover={
                !isDeleted
                  ? { scale: 1.01, boxShadow: "0 10px 24px rgba(17,24,39,0.12)" }
                  : undefined
              }
              whileTap={!isDeleted ? { scale: 0.99 } : undefined}
              type="button"
              disabled={isDeleted}
              className="flex w-66 flex-col overflow-hidden rounded-xl text-left shadow-[0_2px_8px_rgba(17,24,39,0.14)] transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--brand-blue) disabled:cursor-default"
              style={{ backgroundColor: getCampaignCardBackground(c.status) }}
              onClick={() => {
                // setTransitioningId만 하고 바로 navigate하면, 그 상태 변경이 화면에
                // 실제로 반영되기 전에 라우터 전환이 먼저 처리돼버릴 수 있음(navigate가
                // 더 빠름). flushSync로 반영을 강제로 먼저 끝내고 넘어감.
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
            >
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
              />
            </motion.button>
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
      {/* 헤더의 탭(HeaderTabs.tsx)엔 활성 표시가 없어서, "지금 나의 티켓/나의
          행사 중 어느 걸 보고 있는지"를 이 제목이 대신 알려줌.
          CampaignSubPageShell의 title 스타일과 통일. 아래 정렬 필터 줄과 같이
          FadeSlide로 감싸서, 탭을 전환할 때(매번 새로 마운트됨) 둘이 같이
          페이드인되도록 함 — 안 그러면 필터 줄만 페이드되고 제목은 그냥
          뚝 나타나서 어색했음. */}
      <FadeSlide>
        <h1 className="text-lg font-bold">{pageTitle}</h1>
      </FadeSlide>

      {/* 정렬 필터 + "행사 추가" 버튼을 합치면 좁은 화면 폭을 넘을 수 있어서
          flex-wrap을 걸어둠 — 안 들어가면 버튼이 다음 줄로 자연스럽게 넘어감 */}
      <FadeSlide className="flex flex-wrap items-center justify-between gap-2">
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
          // InlineSortFilter.tsx의 활성 정렬 pill과 완전히 같은 디자인(클래스/스타일
          // 값 그대로 복사) — 노란 강조색 대신, 목록 안 여러 UI가 같은 알약 버튼
          // 톤을 공유하도록 통일함.
          <button
            type="button"
            onClick={() => navigate("/campaigns/create")}
            className="flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--ink)",
              borderColor: "var(--line)",
              color: "var(--paper)",
              boxShadow: "inset 0 0 0 1.5px var(--paper)",
            }}
          >
            <Plus size={14} strokeWidth={2} />
            행사 추가
          </button>
        )}
      </FadeSlide>

      <LoadingFade isLoading={isLoading}>{renderBody()}</LoadingFade>
    </div>
  );
}
