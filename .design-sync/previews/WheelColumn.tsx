import type { ReactNode } from "react";
import {
  WheelColumn,
  ROW_HEIGHT,
  WHEEL_PADDING,
} from "@/shared/components/datetime/WheelColumn";

// WheelColumn은 항상 DateTimePickerField의 모달 안, 밝은 패널(--ink =
// 페이지 배경색인 흰색) 위에서 3개(오전오후/시/분)가 나란히 쓰임 - 이 패널
// 배경 + 하이라이트 밴드까지 그대로 재현해서 실제 맥락과 동일하게 보이게 함.
// DateTimePickerField.tsx의 시간 타임휠 부분(301~332줄)과 동일한 마크업.
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

const MERIDIEM_ITEMS = [
  { value: 0, label: "오전" },
  { value: 1, label: "오후" },
];
const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));
const MINUTE_ITEMS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

// 실제 DateTimePickerField가 쓰는 조합 그대로 - 오전오후/시(둘 다
// circular=false, 끝이 있는 휠) + 분(circular=true, 기본값 - 무한 순환).
// 이 컴포넌트의 가장 흔하고 대표적인 사용 형태.
export function TimeWheelRow() {
  return (
    <PanelWrapper>
      <WheelColumn
        items={MERIDIEM_ITEMS}
        selectedValue={1}
        onChange={() => {}}
        circular={false}
      />
      <WheelColumn
        items={HOUR_ITEMS}
        selectedValue={8}
        onChange={() => {}}
        circular={false}
      />
      <span className="flex items-center text-sm text-(--muted)">:</span>
      <WheelColumn items={MINUTE_ITEMS} selectedValue={30} onChange={() => {}} />
    </PanelWrapper>
  );
}

// circular=false(오전/오후) - 끝이 있는 짧은 휠. 항목이 2개뿐이라 순환시킬
// 필요가 없는 경우.
export function NonCircular() {
  return (
    <PanelWrapper>
      <WheelColumn
        items={MERIDIEM_ITEMS}
        selectedValue={0}
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
