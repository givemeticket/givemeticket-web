import { Modal } from "./Modal";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true면 확인 버튼을 경고색으로(삭제처럼 되돌릴 수 없는 위험한 동작용) */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// 네이티브 confirm()을 대체하는 확인창. 스타일링이 안 되는 브라우저 기본 다이얼로그
// 대신, 다른 UI들이랑 일관된 톤으로 보여줌. Modal 위에 "제목+설명+확인/취소 버튼"
// 조합만 얹은 것.
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div
        className="w-full max-w-xs rounded-2xl border p-5"
        style={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }}
      >
        <h2 className="text-base font-bold text-(--paper)">{title}</h2>
        {description && (
          <p className="mt-2 text-sm text-(--muted)">{description}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
          {danger ? (
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full px-4 py-3 text-sm font-semibold text-(--on-brand)"
              style={{ backgroundColor: "var(--warn)" }}
            >
              {confirmLabel}
            </button>
          ) : (
            <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
          )}
        </div>
      </div>
    </Modal>
  );
}
