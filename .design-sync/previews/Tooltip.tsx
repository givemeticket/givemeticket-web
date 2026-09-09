import { useLayoutEffect, useRef } from "react";
import { CircleAlert, ArrowUpDown, Link2 } from "lucide-react";
import { Tooltip } from "@/shared/components/overlay/Tooltip";

// Tooltip은 데스크톱에서 CSS :hover(group-hover)만으로 뜨는데, 정적 스크린샷은
// hover를 흉내낼 수 없어서 항상 안 보이는 상태로 캡처됨. 하지만 터치 기기를
// 위한 진짜 React state 기반 표시 방식(tapToShow + touchVisible state)도
// 지원하므로, 마운트 직후 트리거에 실제 touchstart 이벤트를 dispatch해서
// 컴포넌트의 실제 이벤트 핸들러가 실제 state를 바꾸게 만듦 — 컴포넌트를
// 고치는 게 아니라 실제로 지원되는 터치 상호작용을 흉내내는 것뿐.
// tapToShow=true는 미리보기에서 항상 강제함(꾹 누르기 타이밍은 정적 캡처로
// 재현 불가능하므로) — 실제 앱에서 IconButton 계열은 hover 전용(tapToShow
// 없음)이지만, 터치 시 어떻게 보이는지는 동일한 컴포넌트/스타일이라 그대로
// 재현 가능함.
//
// 중요: ref는 반드시 Tooltip의 children(트리거) 쪽, 즉 Tooltip이 렌더링하는
// 실제 루트 <span onTouchStart>의 자손에 붙여야 함. 처음엔 Tooltip 전체를
// 감싸는 바깥쪽 span에 ref를 달았는데, 그러면 dispatchEvent의 target이 그
// 바깥쪽 span이 되어 이벤트가 "위로만"(조상 방향으로만) 버블링되고, 그 안쪽
// 자손인 Tooltip의 실제 onTouchStart 핸들러(DOM 트리 기준 더 아래)까지는
// 절대 전달되지 않아서 툴팁이 계속 안 보이는 문제가 있었음(실제로 캡처해서
// 확인함 — 아이콘만 보이고 말풍선이 전혀 안 뜸). ref를 Tooltip 안쪽(children)
// 요소로 옮기면, 그 요소에서 dispatch한 이벤트가 Tooltip의 루트 span까지
// 정상적으로 버블링되어 실제 핸들러가 호출됨.
//
// 추가로 useEffect가 아니라 useLayoutEffect를 씀 — useEffect는 브라우저가
// 처음 페인트를 마친 "이후"에 비동기로 실행되는데, 이 미리보기 캡처 스크립트는
// networkidle(네트워크 유휴) 시점 기준으로 넘어가서 곧바로 스크린샷을 찍기
// 때문에, 그 짧은 틈에 실제로 opacity가 0인 첫 페인트가 스크린샷에 찍히는
// 경쟁 상태(race condition)가 있었음(로그로 실제 확인함 — 같은 코드가 캡처
// 타이밍에 따라 보였다 안 보였다 함). useLayoutEffect는 DOM 커밋 직후,
// 브라우저가 화면에 그리기 전에 동기적으로 실행되므로 첫 페인트 자체가 이미
// touchVisible=true인 상태로 그려짐 — 경쟁 상태 자체가 없어짐.
function useTouchReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    ref.current?.dispatchEvent(new Event("touchstart", { bubbles: true }));
  }, []);
  return ref;
}

// placement="right" — CampaignFormFields/DateTimePickerField의 라벨 옆 안내
// 아이콘. 트리거 바로 위에 다른 UI(입력 필드)가 있어서 위로 펼 공간이 없는
// 경우에 씀. 실제로 tapToShow가 이미 true로 쓰이는 케이스.
export function Default() {
  const ref = useTouchReveal<HTMLSpanElement>();
  return (
    <span style={{ display: "inline-block", marginTop: 24, marginLeft: 8 }}>
      <Tooltip content="정원 유지 또는 증원만 가능합니다." placement="right" tapToShow>
        <span ref={ref} className="-m-2 inline-flex p-2">
          <CircleAlert size={14} strokeWidth={2} className="text-(--muted)" />
        </span>
      </Tooltip>
    </span>
  );
}

// placement="top" + align="center"(기본) — IconButton(예: 정렬 순서 변경)이
// 트리거 중앙 기준 좌우 대칭으로 위에 띄우는 가장 흔한 형태.
export function TopCenter() {
  const ref = useTouchReveal<HTMLSpanElement>();
  return (
    <span style={{ display: "inline-block", marginTop: 40 }}>
      <Tooltip content="정렬 순서 변경" tapToShow>
        <span
          ref={ref}
          className="flex h-9 w-9 items-center justify-center rounded-full text-(--muted)"
        >
          <ArrowUpDown size={16} strokeWidth={2} />
        </span>
      </Tooltip>
    </span>
  );
}

// placement="top" + align="left" — 화면/컨테이너 왼쪽 가장자리에 가까운
// 트리거(예: CampaignDetailPage 왼쪽 여백에 바로 붙는 링크 복사 버튼)는
// 중앙 정렬로는 툴팁 왼쪽이 잘릴 위험이 있어 트리거 왼쪽 끝 기준으로만 펼침.
export function TopLeft() {
  const ref = useTouchReveal<HTMLSpanElement>();
  return (
    <span
      style={{ display: "inline-block", marginTop: 40, marginLeft: 4 }}
    >
      <Tooltip content="링크 복사" align="left" tapToShow>
        <span
          ref={ref}
          className="flex h-9 w-9 items-center justify-center rounded-full text-(--muted)"
        >
          <Link2 size={17} strokeWidth={1.7} />
        </span>
      </Tooltip>
    </span>
  );
}
