import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  /** 툴팁 박스가 트리거 기준 어느 방향으로 펼쳐질지. 기본 "center"(트리거
   * 중앙 기준 좌우 대칭). 트리거가 화면/컨테이너의 왼쪽 가장자리에 가까이
   * 붙어있어서 중앙 정렬로는 툴팁 왼쪽이 화면 밖으로 잘릴 위험이 있는
   * 경우에만 "left"(트리거 왼쪽 끝을 기준으로 오른쪽으로만 펼침)를 줌.
   * placement="right"일 때는 안 쓰임(항상 세로 중앙 정렬이라 의미가 없음). */
  align?: "center" | "left";
  /** 툴팁이 트리거 기준 어느 쪽에 뜰지. 기본 "top"(위쪽, 꼬리가 아래를
   * 가리킴). "right"면 트리거 오른쪽에 뜨고 꼬리가 왼쪽(트리거 쪽)을 가리킴 —
   * 트리거 바로 위에 다른 UI가 있어서 위로 펼 공간이 없는 경우에 씀. */
  placement?: "top" | "right";
  /** true면 터치 시 꾹 누르지 않고 짧게 탭만 해도(터치 시작 즉시) 바로 뜸.
   * 기본 false(꾹 누르기 필요, 아래 설명 참고) — 실제 동작(클릭)이 있는
   * 버튼에 이 값을 true로 주면 "툴팁만 보려던" 탭에도 그 동작이 실행될 수
   * 있어서, 클릭 동작이 없는 순수 안내 아이콘에만 쓰는 걸 권장함. */
  tapToShow?: boolean;
}

const LONG_PRESS_MS = 500;
const TOUCH_VISIBLE_MS = 1500;

// 브라우저 기본 title 속성 대신 쓰는 스타일링된 툴팁. 트리거 바로 위(또는
// placement="right"면 오른쪽)에 뜨고, 작은 꼬리로 이어짐(UserMenu 드롭다운
// 꼬리랑 같은 기법 — 45도 회전시킨 정사각형).
//
// 데스크톱(마우스)에서는 CSS(group-hover)만으로 뜸 — 원래 이 컴포넌트가
// "별도 state/JS 없이 가볍게"를 목표로 이렇게만 짜여 있었음. 하지만 터치
// 기기엔 "hover" 상태 자체가 없어서(손가락은 화면에 닿거나 안 닿거나 둘 중
// 하나) CSS만으로는 대응이 안 됨 — 그래서 터치는 기본적으로 "꾹 누르기
// (long-press)"로 따로 감지함(JS 필요, 위 목표를 일부 포기함).
//
// 꾹 눌러서(또는 tapToShow면 짧게 탭만 해도) 띄운 경우, 손을 뗄 때 뒤이어
// 브라우저가 합성해서 발생시키는 click 이벤트를 touchend에서 preventDefault()로
// 막음 — 안 그러면 트리거가 실제 동작이 있는 버튼일 때(예: IconButton의 정렬
// 토글), "툴팁만 보려고 눌렀는데 그 버튼 동작까지 같이 실행되는" 문제가 생김.
// tapToShow가 아닐 때는 500ms 안에 손을 떼면(짧은 탭) 이 로직이 아예 개입하지
// 않아서 평소처럼 클릭이 정상 실행됨.
export function Tooltip({
  content,
  children,
  align = "center",
  placement = "top",
  tapToShow = false,
}: TooltipProps) {
  const [touchVisible, setTouchVisible] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  // "이번 터치가 툴팁을 띄울 만큼 인정됐는지"(꾹 누르기 성공, 또는
  // tapToShow면 터치 시작 즉시)를 state가 아니라 ref로 들고 있음 — touchend
  // 핸들러 안에서 바로 동기적으로 읽어야 하는 값이라(리렌더를 기다릴 필요
  // 없음) state로 두면 오히려 배칭 타이밍 때문에 낡은 값을 읽을 위험이 있음.
  const shownByTouch = useRef(false);

  // 언마운트 시 타이머 정리 — 안 그러면 이미 사라진 컴포넌트의 setState를
  // 뒤늦게 호출하려고 시도할 수 있음.
  useEffect(() => {
    return () => {
      clearTimeout(longPressTimer.current);
      clearTimeout(hideTimer.current);
    };
  }, []);

  function handleTouchStart() {
    clearTimeout(hideTimer.current);
    if (tapToShow) {
      // 꾹 누를 필요 없이 터치 시작 즉시 바로 보여줌
      shownByTouch.current = true;
      setTouchVisible(true);
      return;
    }
    shownByTouch.current = false;
    longPressTimer.current = setTimeout(() => {
      shownByTouch.current = true;
      setTouchVisible(true);
    }, LONG_PRESS_MS);
  }

  function handleTouchEnd(e: TouchEvent) {
    clearTimeout(longPressTimer.current);
    if (shownByTouch.current) {
      // 툴팁을 보려고 누른 것으로 간주 — 뒤이어 합성되는 click을 막음(위 설명 참고).
      e.preventDefault();
      hideTimer.current = setTimeout(
        () => setTouchVisible(false),
        TOUCH_VISIBLE_MS,
      );
    }
  }

  function handleTouchMove() {
    // 누른 채로 손가락을 움직이면 스크롤/드래그로 보고 꾹 누르기를 취소함
    // (tapToShow면 이미 떴으니 취소할 타이머가 없어 영향 없음)
    clearTimeout(longPressTimer.current);
  }

  function handleTouchCancel() {
    clearTimeout(longPressTimer.current);
    setTouchVisible(false);
  }

  const isLeft = align === "left";
  const isRight = placement === "right";

  return (
    <span
      className="group relative inline-flex"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchCancel}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-30 w-max max-w-56 rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${
          isRight
            ? "top-1/2 left-full ml-2 -translate-y-1/2"
            : `bottom-full mb-2 ${isLeft ? "left-0" : "left-1/2 -translate-x-1/2"}`
        }`}
        style={{
          backgroundColor: "var(--ink)",
          color: "var(--paper)",
          border: "1px solid var(--line)",
          // 터치로 띄운 상태는 hover가 아니라서 group-hover로는 못 잡음 —
          // opacity를 인라인으로 직접 줘서(설정 안 하면 기존 클래스가 그대로
          // 적용됨) 강제로 보이게 함.
          opacity: touchVisible ? 1 : undefined,
        }}
      >
        {content}
        <span
          className={
            isRight
              ? "absolute top-1/2 left-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-l"
              : `absolute top-full h-2 w-2 -translate-y-1/2 rotate-45 border-b border-r ${
                  isLeft ? "left-4" : "left-1/2 -translate-x-1/2"
                }`
          }
          style={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }}
        />
      </span>
    </span>
  );
}
