// 행사 목록(나의 티켓 / 내가 만든 행사)에서 공통으로 쓰는 카드.
// 실제 영화/공연 티켓처럼 오른쪽에 반원 노치(notch)로 잘려나간 "스텁"이 붙은 모양.

export type CampaignStatus = "SCHEDULED" | "OPEN" | "FULL" | "CLOSED";

interface CampaignCardProps {
  title: string;
  status: CampaignStatus;
  /** 이미 포맷된 문자열로 받음 (예: "8월 20일 20:00 오픈") */
  openAtLabel: string;
  remainingStock?: number;
  totalStock?: number;
  onClick?: () => void;
}

const STATUS_META: Record<
  CampaignStatus,
  { label: string; bg: string; fg: string }
> = {
  SCHEDULED: { label: "예정", bg: "var(--brand-blue-dim)", fg: "var(--paper)" },
  OPEN: { label: "진행중", bg: "var(--brand-yellow)", fg: "var(--ink)" },
  FULL: { label: "마감임박", bg: "var(--warn)", fg: "var(--paper)" },
  CLOSED: { label: "종료", bg: "var(--ink-soft)", fg: "var(--muted)" },
};

const STUB_WIDTH = "4rem"; // 64px, 오른쪽 스텁 영역 너비. 노치 위치 계산에도 사용됨.

export function CampaignCard({
  title,
  status,
  openAtLabel,
  remainingStock,
  totalStock,
  onClick,
}: CampaignCardProps) {
  const meta = STATUS_META[status];
  const hasStock =
    typeof remainingStock === "number" && typeof totalStock === "number";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--brand-yellow) active:scale-[0.99]"
    >
      <div
        className="flex overflow-hidden rounded-2xl border"
        style={{
          borderColor: "var(--line)",
          backgroundColor: "var(--ink-soft)",
        }}
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
          <p className="mt-1 text-xs text-(--muted)">{openAtLabel}</p>

          {hasStock && (
            <p className="mt-3 text-xs text-(--muted)">
              잔여{" "}
              <span className="font-semibold text-(--paper)">
                {remainingStock} / {totalStock}
              </span>
            </p>
          )}
        </div>

        {/* 점선 절취선 + 스텁 */}
        <div
          className="flex flex-col items-center justify-center border-l border-dashed"
          style={{ width: STUB_WIDTH, borderColor: "var(--line)" }}
        >
          <TicketStubMark />
        </div>
      </div>

      {/* 절취선 위치에 맞춘 반원 노치 (위/아래) — 카드 배경이 아니라 페이지 배경색으로 뚫어내는 효과 */}
      <span
        className="pointer-events-none absolute -top-2.5 h-5 w-5 -translate-x-1/2 rounded-full"
        style={{
          right: `calc(${STUB_WIDTH} - 0.5px)`,
          backgroundColor: "var(--ink)",
        }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -bottom-2.5 h-5 w-5 -translate-x-1/2 rounded-full"
        style={{
          right: `calc(${STUB_WIDTH} - 0.5px)`,
          backgroundColor: "var(--ink)",
        }}
        aria-hidden="true"
      />
    </button>
  );
}

function TicketStubMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--brand-yellow)"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 12.3 10.8 14.5 15.5 9.5"
        stroke="var(--brand-yellow)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
