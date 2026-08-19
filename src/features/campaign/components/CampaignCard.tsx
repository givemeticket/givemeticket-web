import { Avatar } from "@/shared/components/Avatar";

// 행사 목록(나의 티켓 / 내가 만든 행사)에서 공통으로 쓰는 카드.
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
  onClick?: () => void;
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
  DELETED: { label: "삭제됨", bg: "var(--ink-soft)", fg: "var(--muted)" },
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
  onClick,
}: CampaignCardProps) {
  // 매진은 별도 상태가 아니라 OPEN + soldOut 조합이라, 뱃지 표시만 그때 덮어씀
  const meta =
    status === "OPEN" && soldOut
      ? { label: "매진", bg: "var(--warn)", fg: "var(--on-brand)" }
      : STATUS_META[status];
  const hasStock =
    typeof remainingStock === "number" && typeof totalStock === "number";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full overflow-hidden rounded-lg border text-left shadow-[0_1px_3px_rgba(17,24,39,0.06)] transition-[transform,box-shadow] duration-200 hover:scale-[1.01] hover:shadow-[0_10px_24px_rgba(17,24,39,0.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--brand-blue) active:scale-[0.99]"
      style={{ borderColor: "var(--line)", backgroundColor: "var(--ink-soft)" }}
    >
      {/* 메인 정보 영역 */}
      <div className="min-w-0 flex-1 p-4">
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
    </button>
  );
}
