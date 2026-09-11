import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";

// 행사 목록(나의 티켓 / 나의 행사)·상세 페이지에서 공통으로 쓰는 카드의
// "내용"만 그림. "보딩패스" 스타일 — 오른쪽에 상태 색상으로 채운 스텁을
// 붙이고, 그 안에 아이콘 대신 잔여 좌석 수를 큼직하게 보여줌.
//
// 카드를 감싸는 바깥 요소(배경색/모서리/그림자 + 페이지 전환 시 카드 이동
// 애니메이션에 쓰이는 motion.div/motion.button + layoutId/whileHover 등)는
// 일부러 이 컴포넌트가 안 갖고 있고, 쓰는 쪽(CampaignListTab.tsx의 목록
// 렌더링, CampaignDetailPage.tsx)이 직접 감싸게 함 — 그래야 이 컴포넌트의
// props가 "카드에 뭘 보여줄지"만 다루고, "페이지 전환 시 어떻게 움직일지"
// (layoutId/animateMove 등 이 앱의 특정 라우팅 애니메이션 시스템 관심사)는
// 몰라도 됨. 실제 애니메이션 동작 자체는 전혀 안 바꿨음 — 원래 이 컴포넌트가
// 직접 렌더링하던 motion.div/motion.button을 그 모양 그대로 두 호출부로
// 옮겼을 뿐(className/prop 값 전부 동일, DOM 중첩 구조도 동일). 그 바깥
// 요소의 배경색 계산(status -> 색상)은 lib/campaignCardBackground.ts의
// getCampaignCardBackground로 옮김 — 컴포넌트 파일이 컴포넌트 외의 것도
// export하면 Fast Refresh가 깨져서(react-refresh/only-export-components),
// campaignCardLayoutId.ts와 같은 자리에 둠.
//
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
  // 글자색을 --muted(대비 약 3.9:1)에서 --paper(15:1)로 올림 — 배경(--ink-soft)은
  // 그대로 둬서 "종료 = 조용한 톤"이라는 인상 자체는 카드 본문이 이미 만들고
  // 있으니 유지되고, 뱃지 글자만 읽기 쉬워짐.
  CLOSED: { label: "종료", bg: "var(--ink-soft)", fg: "var(--paper)" },
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
}: CampaignCardProps) {
  // 매진은 별도 상태가 아니라 OPEN + soldOut 조합이라, 뱃지 표시만 그때 덮어씀
  const meta =
    status === "OPEN" && soldOut
      ? { label: "매진", bg: "var(--warn)", fg: "var(--on-brand)" }
      : STATUS_META[status];
  const hasStock =
    typeof remainingStock === "number" && typeof totalStock === "number";

  return (
    <>
      {/* 썸네일 — 등록된 게 없으면(아직 등록 기능 자체가 없어서 항상 이 경우) 플레이스홀더.
          좁은 화면(640px 미만)에서는 작게 줄여서, 그 옆 제목/닉네임 영역이
          너무 눌리지 않게 함(재고 스텁까지 겹치면 320px에서 거의 안 보였음).
          카드 전체는 기본 정렬(stretch)을 그대로 둬야 오른쪽 재고 스텁의
          border-l이 카드 높이 전체를 채우는데, 그러면 명시적 높이가 있는
          이 썸네일만 늘어나지 않고 위쪽에 붙어버려서(flex-start로 대체됨)
          self-center로 얘만 따로 세로 가운데 정렬함 */}
      <img
        src={imageUrl || "/gray_logo.png"}
        alt=""
        className="m-3 h-16 w-16 shrink-0 self-center rounded-lg object-cover sm:h-25.5 sm:w-25.5"
      />

      {/* 메인 정보 영역. 재고 스텁이 있을 때만 stub-dashed-mirror를 붙임 —
          스텁 쪽 점선과 짝을 이뤄 경계선이 점선 중앙을 관통하는 것처럼
          보이게 하는 용도라, 스텁 자체가 없으면 필요 없음. */}
      <div
        className={`min-w-0 flex-1 py-4 pr-4 ${hasStock ? "stub-dashed-mirror" : ""}`}
      >
        <Badge label={meta.label} bg={meta.bg} fg={meta.fg} />

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

      {/* 상태 색상으로 채운 스텁 — 잔여 좌석을 숫자로 강조.
          왼쪽 경계에 종이 질감 + 흰 점선 구분선을 그려주므로 border-l은
          따로 안 씀(카드 본문과 재질이 다르게 보이던 문제 해결) */}
      {hasStock && (
        <div
          className="stub-dashed flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 pl-1.5 sm:w-24"
          style={{ backgroundColor: meta.bg }}
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
}
