interface BadgeProps {
  label: string;
  /** 배경색 (보통 var(--토큰) 형태로 넘김) */
  bg: string;
  /** 글자색 */
  fg: string;
  /** 호출부에서 flex 자식으로 쓸 때 shrink-0 등을 얹고 싶을 때만 넘김 */
  className?: string;
}

// 상태를 나타내는 작은 알약 모양 뱃지. 원래 CampaignCard.tsx 안에 상태별
// 배경/글자색을 인라인으로 직접 그리던 마크업을 공용으로 뺌 — 다른 화면에서도
// "진행중"/"매진" 같은 상태 뱃지가 필요할 때 이 색상 조합 로직을 새로 만들지
// 않고 재사용할 수 있게 함. 원래 종이 질감(status-texture)을 함께 얹었는데,
// 카드 전반의 질감 처리를 없애기로 하면서 순수 단색 배경만 남김.
//
// whitespace-nowrap을 항상 줌 — 라벨은 항상 "진행중"/"매진"처럼 짧은
// 한 단어라 줄바꿈될 이유가 없는데, flex 자식으로 쓰이는 곳(모바일 와이드
// 카드의 배지+제목 줄, CampaignCard.tsx)에서 공간이 좁아지면 flex가 이
// 뱃지까지 shrink하려다 텍스트가 줄바꿈되며 알약 모양이 찌그러지는 문제가
// 있었음 — nowrap으로 애초에 줄바꿈 자체를 막아서 그 경우에도 항상
// 온전한 모양을 유지함(shrink는 여전히 호출부의 shrink-0으로 막아야 함,
// nowrap만으로는 폭 자체가 줄어드는 것까진 못 막음).
export function Badge({ label, bg, fg, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${className}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}
