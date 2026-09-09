import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

// 포커스 이동/트랩 대상으로 인정할 "포커스 가능한 요소" 기준. disabled가 아닌
// 네이티브 인터랙티브 요소 + 명시적으로 tabindex를 준(-1 제외) 요소.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// 화면 전체를 덮는 반투명 배경 + "배경 클릭하면 닫기"만 담당하는 순수 껍데기.
// 안쪽 패널의 생김새(크기/배경색/둥근모서리 등)는 완전히 children한테 맡김 —
// 달력 모달이랑 확인창(ConfirmDialog)이 서로 다른 모양이라 여기서 정해두면 안 됨.
//
// 드롭다운류(UserMenu 등)가 쓰는 useClickOutside랑 비슷해 보이지만 다른 문제임 —
// 배경이 이미 화면 전체를 덮고 있어서, document에 리스너를 달고 ref로 바깥 클릭인지
// 판단할 필요 없이 배경 자체에 onClick만 걸면 됨. 안쪽 패널 클릭이 배경까지
// 버블링되지 않도록 stopPropagation만 별도로 처리함.
//
// stopPropagation을 걸려고 감싼 div엔 className="contents"를 줬음 — 이게 없으면
// 이 div가 flex 배경의 "내용물 크기에 맞춰지는 빈 flex 아이템"이 되면서, 그 안의
// 패널이 쓰는 w-full(부모 너비 100%) 계산이 꼬여서 레이아웃이 찌그러지는 문제가 있었음.
// contents는 이 div를 레이아웃엔 아예 안 끼우고(자식이 배경의 직속 자식인 것처럼 동작)
// 이벤트 처리(클릭 전파 차단)만 그대로 유지해줌 — display:contents라도 DOM 노드 자체는
// 그대로 있어서 querySelectorAll로 그 안의 포커스 가능한 요소를 찾는 덴 문제없음.
export function Modal({ isOpen, onClose, children }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 열릴 때: 지금 포커스를 기억해두고(닫힐 때 되돌리기 위함), 배경(backdrop)
  // 자체로 포커스를 옮김 — 안 그러면 키보드 사용자는 모달이 뜬 뒤에도 포커스가
  // 여전히 뒤쪽 배경 요소에 남아있어서 뭐가 열렸는지도 모른 채 Tab을 눌러야 함.
  //
  // 패널 안 "첫 번째 포커스 가능한 요소"로 바로 옮기지 않는 이유: 그 요소가
  // 툴팁을 감싼 아이콘 버튼(DateTimePickerField의 "이전 달" 등)일 경우, 방금
  // 추가한 Tooltip의 group-focus-within 트리거와 겹쳐서 사용자가 손도 안 댔는데
  // 모달이 열리자마자 그 버튼의 툴팁이 떠 있는 것처럼 보이는 버그가 있었음
  // (실제로 겪음). 배경으로 포커스를 옮겨두면 이 부작용 없이, Tab을 누르는
  // 순간 자연스럽게 문서 순서상 다음 요소(패널의 첫 번째 버튼)로 넘어감 — 즉
  // 키보드 사용자 경험은 동일하게 유지됨.
  //
  // 닫힐 때(cleanup): 기억해둔 원래 포커스(대개 이 모달을 연 트리거 버튼)로 되돌림.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    backdropRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  // Esc로 닫기 + Tab/Shift+Tab이 모달 밖(배경)으로 못 나가게 포커스를 패널
  // 안에서만 순환시킴(포커스 트랩). document 레벨로 듣는 이유: 배경 div가
  // 실제 화면 전체를 덮고 있긴 하지만, 키보드 이벤트는 "지금 포커스된 요소"를
  // 기준으로 발생하므로 모달 안 어디에 포커스가 있어도 항상 잡아내려면
  // document에서 듣는 게 가장 간단하고 확실함.
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      // tabIndex=-1: Tab 키로는 도달 못 하지만(포커스 트랩에 별도로 안 끼임)
      // .focus()로 프로그래밍적으로는 포커스 가능 — 위 useEffect의 초기 포커스
      // 대상 전용. outline-none은 이 배경 자체엔 시각적으로 보일 포커스 링이
      // 의미 없어서(화면 전체를 덮는 투명 요소) 브라우저 기본 아웃라인만 끔.
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 outline-none"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="contents"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
