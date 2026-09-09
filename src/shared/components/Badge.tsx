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
// 않고 재사용할 수 있게 함. status-texture는 종이 질감(paper.png)을
// blend-multiply로 얹는 클래스 — 카드 배경(paper-texture)과 같은 재질 계열로
// 보이게 하려는 것.
export function Badge({ label, bg, fg }: BadgeProps) {
  return (
    <span
      className="status-texture inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}
