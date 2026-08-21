import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";

// DateTimePickerField의 모달 레이아웃(하이라이트 밴드 위치 등)도 이 값들을 그대로
// 써야 해서 export함 — 두 파일이 같은 값을 따로따로 들고 있으면 어긋날 수 있음.
export const ROW_HEIGHT = 40;
export const VISIBLE_ROWS = 5;
export const WHEEL_PADDING = (ROW_HEIGHT * (VISIBLE_ROWS - 1)) / 2;

// 순환(무한) 스크롤 휠 설정.
// 실제 항목 리스트를 여러 벌 이어붙여서, 끝에 닿기 전에 티 안 나게 가운데 사본으로
// 순간 이동시키는 방식으로 "끝없이 도는" 느낌을 냄.
// REPEAT을 넉넉히 크게 잡아서, 정상적인 사용 중에는 재배치가 사실상 발동하지 않게 함
// (재배치가 스크롤 도중 자주 끼어들면 그 자체로 끊기는 느낌의 원인이 됨).
const REPEAT = 21;
const MIDDLE_COPY = Math.floor(REPEAT / 2);
const RECENTER_MARGIN = 2;
const SUPPORTS_SCROLLEND =
  typeof window !== "undefined" && "onscrollend" in window;

// 세로 스크롤 + snap으로 동작하는 휠 하나. DateTimePickerField의 오전오후/시/분 3개가
// 각각 이 컴포넌트의 별도 인스턴스임.
export function WheelColumn({
  items,
  selectedValue,
  onChange,
  circular = true,
}: {
  items: { value: number; label: string }[];
  selectedValue: number;
  onChange: (value: number) => void;
  /** false면 항목을 반복하지 않음 (예: 오전/오후처럼 2개뿐인 휠) */
  circular?: boolean;
}) {
  const n = items.length;
  const repeatCount = circular ? REPEAT : 1;
  const middleCopy = circular ? MIDDLE_COPY : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammaticRef = useRef(false);
  // 방금 우리 스스로(스크롤 확정)로 만들어낸 값. 이 값과 selectedValue가 같으면
  // "밖에서 강제로 바뀐 게 아니라 우리가 만든 변화"라는 뜻이라 재동기화를 건너뜀.
  const lastCommittedRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // 휠 이벤트로 이동시킬 때, 마지막으로 우리가 "여기로 가라"고 지시한 목표 인덱스.
  // smooth 애니메이션이 끝나기 전에 다음 휠 이벤트가 또 들어오면, 아직 애니메이션
  // 중이라 부정확할 수 있는 el.scrollTop을 다시 읽는 대신 이 값에 이어서 더함.
  const wheelTargetIndexRef = useRef<number | null>(null);

  function indexOfValue(v: number) {
    const i = items.findIndex((it) => it.value === v);
    return middleCopy * n + Math.max(0, i);
  }

  const [rawIndex, setRawIndex] = useState(() => indexOfValue(selectedValue));

  // 최초 마운트 시 위치 맞춤
  useEffect(() => {
    if (!containerRef.current) return;
    const idx = indexOfValue(selectedValue);
    isProgrammaticRef.current = true;
    containerRef.current.scrollTop = idx * ROW_HEIGHT;
    setRawIndex(idx);
    const t = setTimeout(() => {
      isProgrammaticRef.current = false;
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 우리가 만든 변화가 아니라 진짜 "밖에서" 값이 바뀐 경우에만 강제로 재동기화.
  // lastCommittedRef 비교만으로는 놓치는 경우가 있어서, 실제로 지금 화면에
  // 표시되고 있는 값이 selectedValue랑 다를 때만 움직이도록 한 번 더 확인함
  // (안 그러면 값이 그대로인데도 위치를 가운데로 되돌려버려서, 무한스크롤 중이던
  // 위치가 리셋되는 문제가 생김 — 예: 오전/오후만 바꿨는데 시간이 초기화되던 버그)
  useEffect(() => {
    if (selectedValue === lastCommittedRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const currentIdx = Math.round(el.scrollTop / ROW_HEIGHT);
    const currentActual = ((currentIdx % n) + n) % n;
    if (items[currentActual]?.value === selectedValue) return;

    const idx = indexOfValue(selectedValue);
    isProgrammaticRef.current = true;
    el.scrollTop = idx * ROW_HEIGHT;
    setRawIndex(idx);
    const t = setTimeout(() => {
      isProgrammaticRef.current = false;
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedValue]);

  function commitAndMaybeRecenter(idx: number) {
    wheelTargetIndexRef.current = null;
    const actual = ((idx % n) + n) % n;
    const value = items[actual].value;
    if (value !== selectedValue) {
      lastCommittedRef.current = value;
      onChange(value);
    }

    if (!circular) return; // 네이티브 스냅이 알아서 가장 가까운 칸으로 맞춰줌

    const copyIndex = Math.floor(idx / n);
    if (
      copyIndex <= RECENTER_MARGIN ||
      copyIndex >= repeatCount - 1 - RECENTER_MARGIN
    ) {
      const el = containerRef.current;
      if (!el) return;
      isProgrammaticRef.current = true;
      const recentered = middleCopy * n + actual;
      el.scrollTop = recentered * ROW_HEIGHT;
      setRawIndex(recentered);
      setTimeout(() => {
        isProgrammaticRef.current = false;
      }, 30);
    }
  }

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    // 매 스크롤 이벤트마다 상태를 갱신하면 리렌더 압박이 커져서 빠른(관성) 스크롤이
    // 끊기므로, 프레임당 한 번으로 제한
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const idx = Math.round(el.scrollTop / ROW_HEIGHT);
      setRawIndex(idx);

      if (isProgrammaticRef.current) return;

      // scrollend를 지원하는 브라우저는 그 이벤트가 정확한 정착 시점을 알려주므로
      // 여기서는 확정 안 함 (추측성 디바운스가 관성 스크롤 도중 성급하게 발동해서
      // 아직 끝나지 않은 네이티브 스냅과 충돌하는 문제를 없애기 위함)
      if (SUPPORTS_SCROLLEND) return;

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      settleTimeoutRef.current = setTimeout(
        () => commitAndMaybeRecenter(idx),
        150,
      );
    });
  }

  // scrollend 리스너는 마운트 시 한 번만 등록되므로, 그 안에서 직접
  // commitAndMaybeRecenter를 참조하면 "처음 열렸을 때의 값"을 계속 들고 있는
  // 낡은 클로저가 돼버림 (다른 휠을 조작해서 selectedValue/onChange가 바뀌어도
  // 이 리스너는 그걸 모름 — 이게 다른 휠까지 같이 흔들리던 진짜 원인이었음).
  // 매 렌더마다 최신 로직으로 갱신되는 ref를 하나 두고, 리스너는 항상 이 ref를
  // 통해서만 호출하도록 함.
  const commitRef = useRef(commitAndMaybeRecenter);
  commitRef.current = commitAndMaybeRecenter;

  // 브라우저가 스크롤이 "진짜로" 끝난 시점을 정확히 알려주는 이벤트.
  // 이게 있으면 몇 ms 동안 조용했다고 추측하는 방식보다 훨씬 정확함.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !SUPPORTS_SCROLLEND) return;

    function handleScrollEnd() {
      if (isProgrammaticRef.current) return;
      const idx = Math.round(el!.scrollTop / ROW_HEIGHT);
      commitRef.current(idx);
    }

    el.addEventListener("scrollend", handleScrollEnd);
    return () => el.removeEventListener("scrollend", handleScrollEnd);
  }, []);

  // 마우스 휠 한 번(notch)은 이벤트 하나로 크게 오지만, 트랙패드는 스와이프 한 번에
  // 작은 델타값이 여러 번 연속으로 들어옴. "이벤트 1번 = 1칸"으로 처리하면 트랙패드에서
  // 여러 칸이 한꺼번에 튀어버려서, 델타값을 누적해뒀다가 일정량 넘을 때만 한 칸씩
  // 움직이는 방식으로 바꿈 (마우스 휠이든 트랙패드든 동일하게 자연스러움).
  const wheelAccumRef = useRef(0);
  const WHEEL_STEP_PX = 45;

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;

    wheelAccumRef.current += e.deltaY;
    if (Math.abs(wheelAccumRef.current) < WHEEL_STEP_PX) return;

    const steps = Math.trunc(wheelAccumRef.current / WHEEL_STEP_PX);
    wheelAccumRef.current -= steps * WHEEL_STEP_PX;

    // 애니메이션이 아직 안 끝났을 수 있는 el.scrollTop을 다시 읽는 대신,
    // 우리가 마지막으로 지시한 목표 위치를 기준으로 이어서 계산 — 그래야 빠르게
    // 연달아 들어오는 이벤트에서도 튀지 않고 정확히 한 칸씩 누적됨
    const base =
      wheelTargetIndexRef.current ?? Math.round(el.scrollTop / ROW_HEIGHT);
    const next = base + steps;
    wheelTargetIndexRef.current = next;

    el.scrollTo({ top: next * ROW_HEIGHT, behavior: "smooth" });
  }

  // 마우스 드래그로 휠을 움직일 수 있게 함. 터치는 브라우저 기본 스와이프 스크롤을
  // 그대로 쓰므로(이미 잘 동작함) pointerType이 mouse일 때만 개입함 — 안 그러면
  // 터치 스크롤이랑 이 로직이 동시에 같은 위치를 건드리면서 서로 충돌함.
  const dragStateRef = useRef<{
    startY: number;
    startScrollTop: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = containerRef.current;
    if (!el) return;
    wheelTargetIndexRef.current = null;
    dragStateRef.current = { startY: e.clientY, startScrollTop: el.scrollTop };
    setIsDragging(true);
    el.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const delta = e.clientY - dragStateRef.current.startY;
    el.scrollTop = dragStateRef.current.startScrollTop - delta;
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragStateRef.current) return;
    dragStateRef.current = null;
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);

    // 드래그 중엔 scroll-snap을 꺼뒀어서, 손을 뗀 시점엔 두 칸 사이 애매한 위치에
    // 멈춰있을 수 있음. 네이티브 스냅은 "활성 스크롤 동작"이 없는 상태에선 애니메이션
    // 없이 순간이동해버려서, 가장 가까운 칸으로 직접 부드럽게 이동시켜줌.
    const el = containerRef.current;
    if (el) {
      const idx = Math.round(el.scrollTop / ROW_HEIGHT);
      el.scrollTo({ top: idx * ROW_HEIGHT, behavior: "smooth" });
    }
  }

  const repeatedItems = Array.from({ length: repeatCount }, (_, copy) =>
    items.map((item, i) => ({ ...item, key: `${copy}-${i}` })),
  ).flat();

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="hide-scrollbar relative z-10 w-14 select-none overflow-y-scroll"
      style={{
        height: ROW_HEIGHT * VISIBLE_ROWS,
        // 드래그 중엔 스냅을 꺼서 커서를 그대로 따라가게 하고, 손을 떼면 다시 켜서
        // (그리고 이미 있는 정착 로직이) 가장 가까운 칸으로 맞춰줌. 스냅을 계속 켜둔
        // 채로 scrollTop을 직접 바꾸면, 브라우저가 매번 즉시 가까운 칸으로 끌어당기려고
        // 해서 드래그가 뚝뚝 끊기는 느낌이 났음.
        scrollSnapType: isDragging ? "none" : "y mandatory",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div style={{ height: WHEEL_PADDING }} />
      {repeatedItems.map((item, index) => (
        <div
          key={item.key}
          className="flex items-center justify-center text-base font-semibold text-(--paper)"
          style={{
            height: ROW_HEIGHT,
            scrollSnapAlign: "center",
            opacity:
              index === rawIndex
                ? 1
                : Math.max(0.25, 1 - Math.abs(index - rawIndex) * 0.35),
          }}
        >
          {item.label}
        </div>
      ))}
      <div style={{ height: WHEEL_PADDING }} />
    </div>
  );
}
