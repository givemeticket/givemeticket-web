import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DateTimePickerField } from "@/shared/components/datetime/DateTimePickerField";
import { nowAsDatetimeLocalValue } from "@/shared/lib/formatDate";

// CampaignFormFields가 실제로 쓰는 라벨 - "행사 추가"/"행사 수정" 폼의
// 오픈시각 필드.
const LABEL = "신청 오픈 시각";

// 닫힌 상태(필드만 보이는 기본 UI) - 신규 생성 폼(CampaignCreatePage)에서
// 쓰는 형태. position:fixed 오버레이가 없으니 portal 없이 그대로 렌더링됨.
export function Default() {
  const [value, setValue] = useState(() => nowAsDatetimeLocalValue());
  return (
    <div style={{ maxWidth: 320 }}>
      <DateTimePickerField label={LABEL} value={value} onChange={setValue} />
    </div>
  );
}

// 이미 오픈된 캠페인을 수정할 때(CampaignEditPage)의 형태 - labelInfo
// 안내 아이콘 + 원래 값과 달라졌을 때 나타나는 되돌리기 버튼까지 같이 보여줌.
// resetToNowOnOpen=true라 모달을 열면 항상 "지금"부터 시작하지만, 여기선
// 모달을 열지 않고 이미 "지금"으로 한 번 바뀐 뒤의 닫힌 상태를 재현함.
export function EditingWithOriginalValue() {
  const original = "2026-01-20T20:00";
  const [value, setValue] = useState(() => nowAsDatetimeLocalValue());
  return (
    <div style={{ maxWidth: 320 }}>
      <DateTimePickerField
        label={LABEL}
        labelInfo="오픈 시각 유지 또는 미래만 가능합니다."
        value={value}
        onChange={setValue}
        minDate={new Date(original)}
        resetToNowOnOpen
        originalValue={original}
      />
    </div>
  );
}

// 달력+타임휠 모달이 열린 상태.
//
// 이 미리보기 카드 프레임(harness)은 카드를 감싸는 wrapper에 CSS transform을
// 걸어두는데, transform이 걸린 조상은 그 안의 position:fixed 자손(Modal이
// 내부적으로 씀)의 기준점을 진짜 뷰포트 대신 자기 자신으로 바꿔버려서
// (CSS 스펙상 알려진 동작) 패널이 세로로 반토막 잘려 보임 - 실제 앱에는
// 이런 transform 조상이 없어서 발생하지 않는, 순전히 이 미리보기 프레임만의
// 문제. createPortal로 document.body에 직접 마운트해서 그 transform 조상을
// 벗어나게 함.
//
// isOpen을 외부에서 강제로 켤 수 있는 prop이 없는 구조라(내부 state로만
// 제어), 실제 트리거인 필드(role="button" div)를 useEffect에서
// 프로그래밍적으로 클릭해서 연다 - Modal.tsx 프리뷰가 쓰는 portal 기법과
// 동일한 이유, 클릭은 컴포넌트가 실제로 갖고 있는 onClick 핸들러를 그대로
// 이용하는 것이라 정당한 방법.
function OpenInner() {
  const [value, setValue] = useState("2026-01-20T20:00");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = containerRef.current?.querySelector(
      '[role="button"]',
    ) as HTMLElement | null;
    trigger?.click();
  }, []);

  return (
    <div ref={containerRef} style={{ maxWidth: 320 }}>
      <DateTimePickerField label={LABEL} value={value} onChange={setValue} />
    </div>
  );
}

export function Open() {
  return createPortal(<OpenInner />, document.body);
}
