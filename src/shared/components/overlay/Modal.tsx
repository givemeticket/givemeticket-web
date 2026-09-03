import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

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
// 이벤트 처리(클릭 전파 차단)만 그대로 유지해줌.
export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={onClose}
    >
      <div className="contents" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
