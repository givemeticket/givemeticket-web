import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { InlineSortFilter } from "@/shared/components/InlineSortFilter";
import { CampaignCard } from "@/features/campaign/components/CampaignCard";
import {
  listCampaigns,
  type CampaignScope,
} from "@/features/campaign/api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { consumeTransitioningCampaignId } from "@/features/campaign/lib/transitioningCampaignStore";
import { isFirstReturnFromRefreshedDetailPage } from "@/shared/lib/navigationSessionStore";
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

  const {
    sortBy,
    sortDirection,
    showExpiredOnly,
    setSortBy,
    setSortDirection,
    setShowExpiredOnly,
  } = useDashboardFilters(fromKey);
  // consumeTransitioningCampaignId()랑 isFirstReturnFromRefreshedDetailPage() 둘 다
  // 소모성(한 번만 유효한 값)이라, 아래 두 state가 서로 다른 useState 초기화 함수
  // 안에서 각자 호출하면 안 됨(두 번째 호출은 항상 "이미 소모됨" 결과가 나옴). 그래서
  // 딱 한 번만 계산해서 ref에 담아두고, 두 state를 거기서 각각 시드함.
  const initialRef = useRef<
    | { transitioningId: number | null; skipLayoutIdForCardId: number | null }
    | undefined
  >(undefined);
  if (initialRef.current === undefined) {
    const id = consumeTransitioningCampaignId();
    if (id !== null && isFirstReturnFromRefreshedDetailPage()) {
      // 새로고침 직후 최초 복귀 — 이 카드 하나만, 이번 렌더링에서만 "이동 중" 특별
      // 취급을 안 함(layoutId 기반 이동 대신 다른 카드들처럼 페이드로)
      initialRef.current = { transitioningId: null, skipLayoutIdForCardId: id };
    } else {
      initialRef.current = { transitioningId: id, skipLayoutIdForCardId: null };
    }
  }

  // "지금 이동 중인 카드가 뭔지" 하나만 추적. 처음엔 상세 페이지에서 돌아온 경우를 위해
  // 저장소 값으로 초기화하고(한 번 읽으면 소모됨), 그 다음부턴 새로 클릭할 때마다
  // 덮어씀 — 예전엔 "돌아온 카드"랑 "새로 클릭한 카드"를 별도 state로 나눠서 관리하다가,
  // 새 카드를 클릭해도 예전 값이 안 지워지고 계속 남아있어서 둘 다 동시에
  // "이동 중"으로 처리되는 버그가 있었음(예전 카드가 애니메이션 내내 목록에 남아있던 원인)
  const [transitioningId, setTransitioningId] = useState<number | null>(
    () => initialRef.current!.transitioningId,
  );

  // 새로고침으로 상세 페이지에 바로 들어온 뒤, 처음으로 목록에 돌아오는 바로 그 순간엔
  // "돌아온 그 카드 하나만" layoutId를 생략해야 함(대신 페이드로). 처음엔 이걸 컴포넌트
  // 전체 플래그로 만들었었는데, 그러면 이 목록 인스턴스가 살아있는 동안 계속(=그 뒤에
  // 다른 카드를 새로 클릭해도) layoutId가 안 붙는 버그가 있었음 — "이 목록에 딱 한 번
  // 있었던 특수 상황"이 "이 인스턴스 전체의 평생 상태"로 잘못 굳어버린 것. 그래서
  // "어떤 카드 id가 이번 딱 한 번만 생략 대상인지"로 좁히고, 첫 렌더링이 끝나자마자
  // (아래 useEffect) 바로 리셋해서 그 다음 클릭부턴(그 카드를 포함해서) 전혀 영향
  // 없게 함.
  const [skipLayoutIdForCardId, setSkipLayoutIdForCardId] = useState<
    number | null
  >(() => initialRef.current!.skipLayoutIdForCardId);
  useEffect(() => {
    setSkipLayoutIdForCardId(null);
  }, []);

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
    if (isLoading) {
      return (
        <p className="py-16 text-center text-sm text-(--muted)">
          불러오는 중...
        </p>
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
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
        <p className="py-16 text-center text-sm text-(--muted)">{emptyTitle}</p>
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
              // layoutId는 평소엔 항상(처음부터) 줌 — Framer Motion이 기준점을 미리
              // 알고 있어야 하기 때문. 실제로 이동해야 하는 카드인지는 animateMove로만
              // 구분함. skipLayoutIdForCardId랑 일치하는 딱 그 카드, 딱 이번 렌더링에서만
              // 생략함 (그 다음 렌더링부턴 이 값 자체가 리셋되어 다시 정상 부여됨)
              layoutId={
                c.id === skipLayoutIdForCardId
                  ? undefined
                  : `campaign-card-${c.id}`
              }
              animateMove={isTransitioning}
              onMoveComplete={() => {
                if (resetTimeoutRef.current)
                  clearTimeout(resetTimeoutRef.current);
                // 주변 페이지의 4초짜리 페이드가 확실히 다 끝난 뒤로 리셋을 늦춤
                // (카드의 3초 이동보다 여유를 좀 더 둠)
                resetTimeoutRef.current = setTimeout(() => {
                  setTransitioningId(null);
                }, 1500);
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
          // 애니메이션 없이 순간 사라졌다 나타나던 버그의 원인). 항상 motion.div로
          // 통일하고 페이드 prop만 조건부로 줘서, 리액트가 "업데이트"로 처리하게 함.
          const fadeProps = isTransitioning
            ? {}
            : {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -8 },
                transition: { duration: 4, ease: "easeInOut" as const },
              };

          return (
            <motion.div key={c.id} {...fadeProps}>
              {card}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
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
      </motion.div>

      {renderBody()}
    </div>
  );
}
