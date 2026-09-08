// 버튼 안에 들어가는 텍스트가 상태에 따라 바뀌면서(카운트다운 -> "신청하기" 등)
// 버튼 너비도 같이 늘었다 줄었다 하면 산만해 보임. 실제로 보여줄 텍스트와, 화면엔
// 안 보이지만 너비 기준이 되는 텍스트(보통 가장 긴 경우)를 CSS Grid로 같은 칸에
// 겹쳐두면, 그 칸의 너비는 둘 중 더 큰 쪽(안 보이는 기준 텍스트)에 맞춰짐.
// (원래 CountdownApplyButton.tsx에만 있던 트릭인데, "신청하기"/"신청 취소"
// 버튼도 카운트다운 버튼과 너비가 딱 맞아야 해서 재사용할 수 있게 분리함 —
// 셋 다 같은 minWidthText("00:00:00")를 쓰면, PrimaryButton/SecondaryButton의
// 패딩·폰트가 이미 동일해서 결과적으로 버튼 너비도 똑같아짐.)
export function FixedWidthLabel({
  text,
  minWidthText,
}: {
  text: string;
  minWidthText: string;
}) {
  return (
    <span className="grid">
      <span className="invisible col-start-1 row-start-1" aria-hidden="true">
        {minWidthText}
      </span>
      <span className="col-start-1 row-start-1">{text}</span>
    </span>
  );
}
