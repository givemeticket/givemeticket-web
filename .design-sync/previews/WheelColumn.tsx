import type { ReactNode } from "react";
import {
  WheelColumn,
  ROW_HEIGHT,
  WHEEL_PADDING,
} from "@/shared/components/datetime/WheelColumn";

// WheelColumn은 항상 DateTimePickerField의 모달 안, 밝은 패널(--ink =
// 페이지 배경색인 흰색) 위에서 2개(시/분)가 콜론을 사이에 두고 나란히
// 쓰임 - 이 패널 배경 + 하이라이트 밴드까지 그대로 재현해서 실제 맥락과
// 동일하게 보이게 함. DateTimePickerField.tsx의 시간 타임휠 부분(280~312줄)과
// 동일한 마크업.
function PanelWrapper({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full max-w-xs rounded-2xl border p-4"
      style={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }}
    >
      <div className="relative flex justify-center gap-1">
        <div
          className="pointer-events-none absolute inset-x-3 rounded-xl"
          style={{
            top: WHEEL_PADDING,
            height: ROW_HEIGHT,
            backgroundColor: "var(--ink-soft)",
            boxShadow: "inset 0 0 0 1.5px var(--brand-blue)",
          }}
        />
        {children}
      </div>
    </div>
  );
}

// 오전/오후 없이 0~23시 그대로 - DateTimePickerField.tsx의 HOUR_ITEMS와
// 동일(MINUTE_ITEMS와 같은 두 자리 패딩). 예전엔 12시간제+오전오후 휠이
// 따로 있었는데, 그 구분을 없애고 시/분 둘 다 같은 형태의 순환 휠로
// 통일함 - 이 프리뷰도 그 변경을 그대로 반영함.
const HOUR_ITEMS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));
const MINUTE_ITEMS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

// 실제 DateTimePickerField가 쓰는 조합 그대로 - 시/분 둘 다 circular=true
// (기본값, 무한 순환 스크롤). 콜론은 하이라이트 밴드에 가려 안 보이던
// 버그를 고치며 relative z-10 + font-bold text-(--paper)로 진하게 바꾼
// 실제 마크업과 동일. 이 컴포넌트의 가장 흔하고 대표적인 사용 형태.
export function TimeWheelRow() {
  return (
    <PanelWrapper>
      <WheelColumn items={HOUR_ITEMS} selectedValue={8} onChange={() => {}} />
      <span className="relative z-10 flex items-center text-base font-bold text-(--paper)">
        :
      </span>
      <WheelColumn items={MINUTE_ITEMS} selectedValue={30} onChange={() => {}} />
    </PanelWrapper>
  );
}

// circular=false - 끝이 있는(순환하지 않는) 휠. 지금 앱 안에서 실제로 쓰는
// 곳은 없지만(시/분 전부 순환 휠로 통일됨), 컴포넌트 자체가 지원하는
// prop이라 그 동작을 보여주는 용도의 예시.
export function NonCircular() {
  return (
    <PanelWrapper>
      <WheelColumn
        items={HOUR_ITEMS}
        selectedValue={8}
        onChange={() => {}}
        circular={false}
      />
    </PanelWrapper>
  );
}

// circular=true(기본값, 분 휠처럼 항목이 많은 경우) - 실제 항목 리스트를
// 여러 벌 이어붙여서 끝없이 도는 것처럼 보이는 무한 스크롤 휠.
export function Circular() {
  return (
    <PanelWrapper>
      <WheelColumn items={MINUTE_ITEMS} selectedValue={45} onChange={() => {}} />
    </PanelWrapper>
  );
}
