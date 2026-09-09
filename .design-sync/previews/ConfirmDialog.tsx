import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/shared/components/overlay/ConfirmDialog";

// ConfirmDialog는 내부적으로 Modal(position: fixed)을 쓰는데, 이 미리보기 카드
// 프레임(harness)의 wrapper에 걸린 CSS transform이 그 fixed 자손의 기준점을
// 뷰포트 대신 자기 자신으로 바꿔버려서 패널이 세로로 잘려 보이는 문제가 있음
// (실제 앱엔 이런 transform 조상이 없어서 발생하지 않는, 순전히 미리보기
// 프레임만의 문제). createPortal로 document.body에 직접 마운트해서 그 transform
// 조상을 벗어나면 실제 앱과 동일하게 렌더링됨 — 컴포넌트/props 사용법은 그대로.
// isOpen은 항상 true로 고정해서 열린 상태만 보여줌.

// 신청 종료 확인 — 되돌릴 수 없는 동작이지만 "위험(danger)"까지는 아닌 케이스
// (CampaignDetailPage의 confirmAction === "close"). 확인 버튼이 일반 PrimaryButton.
export function Default() {
  return createPortal(
    <ConfirmDialog
      isOpen
      title="신청을 종료하시겠어요?"
      description="새 신청만 막히고, 이미 확정된 신청은 그대로 유지돼요. 되돌릴 수 없어요."
      confirmLabel="종료"
      onConfirm={() => {}}
      onCancel={() => {}}
    />,
    document.body,
  );
}

// 삭제 확인 — danger=true라 확인 버튼이 경고색(--warn)으로 바뀜
// (CampaignDetailPage의 confirmAction === "delete").
export function Danger() {
  return createPortal(
    <ConfirmDialog
      isOpen
      title="정말 삭제하시겠어요?"
      description="신청자가 있어도 전부 취소되고, 되돌릴 수 없어요."
      confirmLabel="삭제"
      danger
      onConfirm={() => {}}
      onCancel={() => {}}
    />,
    document.body,
  );
}

// 회원 탈퇴 확인 — danger + 짧은 한 줄 설명만 있는 경우
// (UserAppShell의 탈퇴 확인창). 설명 길이가 짧을 때의 레이아웃 확인용.
export function Withdraw() {
  return createPortal(
    <ConfirmDialog
      isOpen
      title="정말 탈퇴하시겠어요?"
      description="되돌릴 수 없어요."
      confirmLabel="탈퇴"
      danger
      onConfirm={() => {}}
      onCancel={() => {}}
    />,
    document.body,
  );
}
