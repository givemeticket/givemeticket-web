import type { CSSProperties } from "react";
import { Ticket } from "lucide-react";
import { Avatar } from "@/shared/components/Avatar";
import { Badge } from "@/shared/components/Badge";
import { getCampaignCardBackground } from "../lib/campaignCardBackground";

// 행사 목록(나의 티켓 / 나의 행사)·상세 페이지에서 공통으로 쓰는 카드의
// "내용"만 그림. "스퀘어 티켓 카드" 스타일 — 위쪽에 썸네일 이미지, 그
// 아래에 제목/주최자/오픈시각, 맨 아래에 상태 색상으로 채운 가로 스텁을
// 붙이고 그 안에 잔여 좌석 수를 큼직하게 보여줌. 예전엔 가로로 긴
// "보딩패스" 스타일(썸네일 왼쪽, 스텁 오른쪽)이었는데, claude.ai/design에서
// 그린 새 디자인(Square Ticket Card)으로 교체함 — 목록/상세 어디서든 항상
// 같은 264px 정사각형에 가까운 크기로 쓰임(호출부가 폭을 고정해서 줌).
//
// 카드를 감싸는 바깥 요소(배경색/모서리/그림자 + 페이지 전환 시 카드 이동
// 애니메이션에 쓰이는 motion.div/motion.button + layoutId/whileHover 등)는
// 일부러 이 컴포넌트가 안 갖고 있고, 쓰는 쪽(CampaignListTab.tsx의 목록
// 렌더링, CampaignDetailPage.tsx)이 직접 감싸게 함 — 그래야 이 컴포넌트의
// props가 "카드에 뭘 보여줄지"만 다루고, "페이지 전환 시 어떻게 움직일지"
// (layoutId/animateMove 등 이 앱의 특정 라우팅 애니메이션 시스템 관심사)는
// 몰라도 됨(animation.md 30번 리팩터 이력). 폭(264px)도 마찬가지로 이
// 컴포넌트가 아니라 호출부 className이 정함 — 그래서 뷰포트 기준
// 반응형(`sm:` 등) 분기가 이제 필요 없음(카드가 항상 고정 폭이라).
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
  const isDeleted = status === "DELETED";
  // 삭제된 행사는 재고 수치 자체가 의미 없어서(hasStock이 보통 false) 숫자
  // 없이 빈 스텁만 보여줌 — 다른 카드들과 높이/구조를 맞추기 위함(스텁이
  // 아예 없으면 삭제된 카드만 유독 짧아 보임).
  const showStub = hasStock || isDeleted;
  // 카드 본문(위)이 실제로 어떤 색으로 보이는지 — 바깥 motion 요소가
  // getCampaignCardBackground로 계산해서 쓰는 것과 동일한 값. 종료(CLOSED)
  // 상태는 스텁 배경(meta.bg)이 이 값과 똑같은 톤(둘 다 --ink-soft)이고,
  // 삭제됨(DELETED)도 마찬가지(둘 다 --deleted) — 이 경우 위/아래 색이
  // 같아서 점선을 두 톤으로 나눠 그릴 이유가 없음(아래 stub-boundary-muted
  // 참고).
  const ambientBg = getCampaignCardBackground(status);
  const singleTone = ambientBg === meta.bg;

  return (
    <>
      {/* 이미지+텍스트 블록 — 카드 자체 패딩(12/12/14)을 여기서만 줌. 스텁은
          이 블록의 형제로 두고 패딩 없이 카드 좌우 끝까지 채워야 해서
          (아래 참고) 패딩을 카드 전체가 아니라 이 블록에만 줌. 경계
          점선은 이 블록엔 없음 — 스텁 쪽의 오버레이 하나가 위로 튀어나와
          이 블록과 스텁 양쪽에 걸쳐 그려짐(아래 stub-boundary 참고). */}
      <div className="p-3 pb-3.5">
        {/* 썸네일 — 등록된 게 없으면(아직 등록 기능 자체가 없어서 항상 이 경우)
            claude.ai/design 템플릿과 같은 모양의 플레이스홀더(대각선 줄무늬
            배경 + 티켓 아이콘)를 보여줌 — 예전 gray_logo.png 대신, "실제
            이미지가 들어갈 자리"라는 걸 명확히 표시하는 디자인 목업 스타일.
            카드 폭에 맞춰 늘어나는 배너 형태(폭 100%, 16:11 비율). 티켓
            아이콘 자체는 템플릿의 CSS mask-image 트릭(둥근 사각형 양옆을
            반원으로 잘라낸 모양)을 그대로 재현하는 대신, 이미 이 앱
            전역에서 쓰는 lucide의 Ticket 아이콘(MyTicketsTab.tsx 등)으로
            대체함 — 시각적 의도(티켓 모양)는 같고, 브라우저별
            mask-composite 지원 편차 없이 훨씬 간단/안전함. */}
        <div className="relative aspect-16/11 w-full overflow-hidden rounded-lg">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="campaign-image-placeholder flex h-full w-full items-center justify-center">
              <Ticket size={28} strokeWidth={1.5} className="text-(--muted)" />
            </div>
          )}
          {/* 상태 뱃지를 이미지 위 좌상단에 오버레이 */}
          <div className="absolute top-2 left-2">
            <Badge label={meta.label} bg={meta.bg} fg={meta.fg} />
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[15px] leading-[1.35] font-semibold text-(--paper)">
          {title}
        </p>
        {ownerNickname && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <Avatar src={ownerProfileImageUrl} name={ownerNickname} size={16} />
            <span className="truncate text-xs text-(--muted)">
              {ownerNickname}
            </span>
          </div>
        )}
        <p className="mt-1.5 text-xs text-(--muted)">{openAtLabel}</p>
      </div>

      {/* 상태 색상으로 채운 스텁 — 잔여 좌석을 숫자로 강조. 카드 폭 100%를
          그대로 채움(예전 오른쪽 세로 스텁의 고정 폭 대신, 카드 아래에
          가로 전체로 붙는 형태). 삭제됨(isDeleted)은 재고 수치가 없어도
          다른 카드와 높이를 맞추기 위해 빈 스텁만 그림 — h-13(52px)을
          명시해서 텍스트가 있든 없든 높이가 항상 같게 함(px-3.5 py-3.5
          패딩 28px + text-base line-height 24px = 52px, border-box라
          텍스트 유무와 무관하게 박스 높이가 고정됨). relative는 아래
          점선 오버레이가 이 스텁을 기준으로 위치 잡게 하기 위함. */}
      {showStub && (
        <div
          className="relative flex h-13 items-center justify-between px-3.5 py-3.5"
          style={{ backgroundColor: meta.bg }}
        >
          {/* 경계 점선 오버레이 — 스텁 위로 2px 튀어나오게 배치해서 카드
              본문(위)과 스텁(아래) 양쪽에 걸쳐 그려짐. claude.ai/design의
              SquareCardList 템플릿 CSS를 그대로 포팅함(index.css의
              .stub-boundary 주석 참고) — 색이 다른 상태(대부분)는 회색+흰
              점선을 반씩, 같은 톤인 상태(종료/삭제됨)는 굵은 회색 점선
              하나만. --stub-boundary-color는 이 스텁의 실제 배경색(meta.bg)을
              그대로 넘겨서 오버레이 자신의 배경도 자연스럽게 이어지게 함. */}
          <div
            aria-hidden
            className={`absolute inset-x-0 -top-0.5 h-1 ${singleTone ? "stub-boundary-muted" : "stub-boundary"}`}
            style={{ "--stub-boundary-color": meta.bg } as CSSProperties}
          />

          {hasStock && (
            <>
              <span
                className="text-base font-extrabold"
                style={{ color: meta.fg }}
              >
                {remainingStock}개 남음
              </span>
              <span
                className="text-[11px] opacity-75"
                style={{ color: meta.fg }}
              >
                {(totalStock as number) - (remainingStock as number)} /{" "}
                {totalStock}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
