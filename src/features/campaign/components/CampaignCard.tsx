import { motion } from "motion/react";
import { Avatar } from "@/shared/components/Avatar";
import { PAGE_TRANSITION_DURATION } from "@/shared/lib/animationDurations";

// 행사 목록(나의 티켓 / 나의 행사)에서 공통으로 쓰는 카드.
// "보딩패스" 스타일 — 오른쪽에 상태 색상으로 채운 스텁을 붙이고,
// 그 안에 아이콘 대신 잔여 좌석 수를 큼직하게 보여줌.

// 백엔드 실제 응답 기준 (2026-08 swagger 확인): 캠페인 상태는 FULL이 따로 없고,
// OPEN이면서 soldOut=true인 경우를 매진으로 취급함.
export type CampaignStatus = "SCHEDULED" | "OPEN" | "CLOSED" | "DELETED";

interface CampaignCardProps {
  title: string;
  status: CampaignStatus;
  soldOut?: boolean;
  /** 이미 포맷된 문자열로 받음 (예: "8월 20일 20:00 오픈") */
  openAtLabel: string;
  remainingStock?: number;
  totalStock?: number;
  /** 주최자 닉네임 */
  ownerNickname?: string;
  /** 주최자 프로필 사진. 동의 안 했으면 null일 수 있음 */
  ownerProfileImageUrl?: string | null;
  /** 행사 썸네일. 아직 등록 기능이 없어서 항상 비어있지만(null), API 스펙에
   * 맞춰 nullable로 받아두고, 없으면 플레이스홀더(gray_logo.png)로 채움 */
  imageUrl?: string | null;
  onClick?: () => void;
  /** false면 순수 표시용(클릭/호버 효과 없음) — 상세 페이지에서 티켓 자체를 보여줄 때처럼
   * 눌러서 어디로 이동할 이유가 없는 경우에 씀 */
  interactive?: boolean;
  /** 목록의 카드와 상세 페이지의 카드가 같은 값을 받으면, 페이지 이동 시
   * "같은 카드가 그 위치로 이동"하는 애니메이션으로 자동 연결됨 (Framer Motion 공유 레이아웃).
   * 모든 카드에 항상(처음 마운트될 때부터) 붙여둬야 함 — 클릭한 순간에야 붙이면,
   * Framer Motion이 "이 요소가 원래 어디 있었는지" 기준점을 못 잡아서 첫 번째
   * 시도에서만 애니메이션이 아예 안 걸리는 문제가 있었음 */
  layoutId?: string;
  /** true면 이 카드가 실제로 이동해야 하는 그 카드 — 정해진 시간(0.35초) 동안 부드럽게
   * 이동함. false(기본값)면, 옆 카드가 빠지면서 자리가 밀려도 즉시(0초) 제자리로
   * 스냅되기만 함 — 밀리는 것까지 다 같이 슬라이드 애니메이션이 걸리면 지저분해짐 */
  animateMove?: boolean;
  /** animateMove가 true인 카드의 이동 애니메이션이 끝나면 호출됨. 목록 쪽에서
   * "이동 중" 취급을 해제하는 데 씀 — 호출하는 쪽에서 리셋 시점을 살짝 늦춰야 함
   * (바로 리셋하면, 아직 화면에 남아있는 주변 페이지의 페이드가 다 안 끝난 상태에서
   * 이 카드의 애니메이션 prop이 갑자기 바뀌면서 깜빡이는 문제가 있었음) */
  onMoveComplete?: () => void;
  /** layout 이동 duration을 강제로 덮어씀(주로 0). 스크롤 오프셋 보정
   * (scrollOffsetStore.ts)에서 오프셋을 없애는 순간, 카드의 측정 위치가 바뀌는
   * 걸 Framer Motion이 "또 다른 이동"으로 착각해서 자체적으로 두 번째 애니메이션을
   * 걸어버리는 문제가 있었음. 그 순간만 이 값을 0으로 줘서 즉시 반영되게 함 —
   * 안 주면(undefined) 평소처럼 animateMove 기준으로 자동 계산됨. */
  layoutDurationOverride?: number;
}

const STATUS_META: Record<
  CampaignStatus,
  { label: string; bg: string; fg: string }
> = {
  SCHEDULED: {
    label: "예정",
    bg: "var(--brand-blue-dim)",
    fg: "var(--on-brand)",
  },
  OPEN: { label: "진행중", bg: "var(--brand-yellow)", fg: "var(--on-yellow)" },
  CLOSED: { label: "종료", bg: "var(--ink-soft)", fg: "var(--muted)" },
  DELETED: { label: "삭제됨", bg: "var(--deleted)", fg: "var(--paper)" },
};

export function CampaignCard({
  title,
  status,
  soldOut = false,
  openAtLabel,
  remainingStock,
  totalStock,
  ownerNickname,
  ownerProfileImageUrl,
  imageUrl,
  onClick,
  interactive = true,
  layoutId,
  animateMove = false,
  onMoveComplete,
  layoutDurationOverride,
}: CampaignCardProps) {
  // 매진은 별도 상태가 아니라 OPEN + soldOut 조합이라, 뱃지 표시만 그때 덮어씀
  const meta =
    status === "OPEN" && soldOut
      ? { label: "매진", bg: "var(--warn)", fg: "var(--on-brand)" }
      : STATUS_META[status];
  const hasStock =
    typeof remainingStock === "number" && typeof totalStock === "number";
  const cardBg = status === "DELETED" ? "var(--deleted)" : "var(--ink-soft)";
  const isDeleted = status === "DELETED";

  const content = (
    <>
      {/* 썸네일 — 등록된 게 없으면(아직 등록 기능 자체가 없어서 항상 이 경우) 플레이스홀더 */}
      <img
        src={imageUrl || "/gray_logo.png"}
        alt=""
        className="m-3 h-25.5 w-25.5 shrink-0 rounded-lg object-cover"
      />

      {/* 메인 정보 영역 */}
      <div className="min-w-0 flex-1 py-4 pr-4">
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: meta.bg, color: meta.fg }}
        >
          {meta.label}
        </span>

        <p className="mt-2 truncate text-base font-semibold text-(--paper)">
          {title}
        </p>
        {ownerNickname && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <Avatar src={ownerProfileImageUrl} name={ownerNickname} size={16} />
            <span className="truncate text-xs text-(--muted)">
              {ownerNickname}
            </span>
          </div>
        )}
        <p className="mt-1 text-xs text-(--muted)">{openAtLabel}</p>
      </div>

      {/* 상태 색상으로 채운 스텁 — 잔여 좌석을 숫자로 강조 */}
      {hasStock && (
        <div
          className="flex w-24 shrink-0 flex-col items-center justify-center gap-0.5 border-l"
          style={{ borderColor: "var(--line)", backgroundColor: meta.bg }}
        >
          <span
            className="text-center text-base font-extrabold leading-tight"
            style={{ color: meta.fg }}
          >
            {remainingStock}개 남음
          </span>
          <span
            className="text-[10px] font-medium opacity-75"
            style={{ color: meta.fg }}
          >
            {(totalStock as number) - (remainingStock as number)} / {totalStock}
          </span>
        </div>
      )}
    </>
  );

  // 위치/크기 이동 애니메이션(layout)의 기본값은 스프링(물리 기반)이라, 감쇠가
  // 부족하면 목표 지점을 지나쳤다가 되돌아오는 튕김 현상이 생김. duration 기반
  // easing으로 명시적으로 바꿔서 한 번에 부드럽게 도착하도록 함.
  // layoutDurationOverride가 있으면 그 값을 최우선으로 씀(주로 스크롤 오프셋
  // 상쇄 시점에 0으로 강제할 때 씀).
  if (!interactive) {
    // 상세 페이지의 카드는 animateMove 개념 자체가 없음(목록처럼 "이동해야 하는
    // 카드"와 "밀리기만 하는 카드"를 구분할 필요가 없어서) — 항상
    // PAGE_TRANSITION_DURATION으로 도착 애니메이션을 재생함.
    const detailLayoutDuration =
      layoutDurationOverride ?? PAGE_TRANSITION_DURATION;
    return (
      <motion.div
        layoutId={layoutId}
        transition={{
          layout: {
            duration: detailLayoutDuration,
            ease: "easeInOut" as const,
          },
        }}
        className="flex w-full overflow-hidden rounded-lg border text-left shadow-[0_1px_3px_rgba(17,24,39,0.06)]"
        style={{ borderColor: "var(--line)", backgroundColor: cardBg }}
      >
        {content}
      </motion.div>
    );
  }

  // 목록의 카드: 실제로 이동해야 하는 카드(animateMove)만 정해진 duration, 나머지
  // (옆 카드가 빠지면서 자리가 밀리기만 하는 카드)는 0초 — 안 그러면 밀리는 것까지
  // 다 슬라이드 애니메이션이 걸려서 지저분해짐.
  const listLayoutDuration =
    layoutDurationOverride ?? (animateMove ? PAGE_TRANSITION_DURATION : 0);
  const layoutTransition = {
    layout: { duration: listLayoutDuration, ease: "easeInOut" as const },
  };

  return (
    <motion.button
      layoutId={layoutId}
      transition={layoutTransition}
      onLayoutAnimationComplete={animateMove ? onMoveComplete : undefined}
      // CSS transition-transform 대신 Framer Motion 자체의 whileHover/whileTap을
      // 씀 — CSS 트랜지션이 transform을 건드리면, layoutId 이동 애니메이션이 매 프레임
      // 만들어내는 transform 값을 CSS가 또 한 번 따로 부드럽게 쫓아가려고 해서,
      // 두 시스템이 같은 속성을 동시에 조작하며 충돌함(카드가 두 개로 보이던 원인).
      whileHover={
        !isDeleted
          ? { scale: 1.01, boxShadow: "0 10px 24px rgba(17,24,39,0.12)" }
          : undefined
      }
      whileTap={!isDeleted ? { scale: 0.99 } : undefined}
      type="button"
      onClick={onClick}
      disabled={isDeleted}
      className="flex w-full overflow-hidden rounded-lg border text-left shadow-[0_1px_3px_rgba(17,24,39,0.06)] transition-shadow duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--brand-blue) disabled:cursor-default"
      style={{ borderColor: "var(--line)", backgroundColor: cardBg }}
    >
      {content}
    </motion.button>
  );
}
