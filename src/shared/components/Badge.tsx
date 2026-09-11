interface BadgeProps {
  label: string;
  /** 배경색 (보통 var(--토큰) 형태로 넘김) */
  bg: string;
  /** 글자색 */
  fg: string;
}

// 상태를 나타내는 작은 알약 모양 뱃지. 원래 CampaignCard.tsx 안에 상태별
// 배경/글자색을 인라인으로 직접 그리던 마크업을 공용으로 뺌 — 다른 화면에서도
// "진행중"/"매진" 같은 상태 뱃지가 필요할 때 이 색상 조합 로직을 새로 만들지
// 않고 재사용할 수 있게 함. 원래 종이 질감(status-texture)을 함께 얹었는데,
// 카드 전반의 질감 처리를 없애기로 하면서 순수 단색 배경만 남김.
export function Badge({ label, bg, fg }: BadgeProps) {
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}
