import { createPortal } from "react-dom";
import { Modal } from "@/shared/components/overlay/Modal";

// Modal 자체는 "화면 전체를 덮는 반투명 배경 + 바깥 클릭 시 닫기"만 담당하는
// 순수 껍데기라서(Modal.tsx 주석 참고), 안쪽 패널 모양은 완전히 children이
// 결정함. ConfirmDialog가 이 위에 얹는 대표적인 패널 스타일을 그대로 재현해서
// 보여줌 - 열린 상태(isOpen=true)로 고정.
//
// createPortal로 document.body에 직접 마운트함: 이 미리보기 카드 프레임(harness)이
// 카드 격리를 위해 바깥 wrapper에 CSS transform을 걸어두는데, transform이 걸린
// 조상은 position:fixed의 기준점을 뷰포트 대신 자기 자신으로 바꿔버려서(CSS
// 스펙상 알려진 동작), Modal의 "fixed inset-0"가 완전히 다른 위치/크기로
// 계산되어 패널이 잘려 보이는 문제가 있었음(실제 앱에서는 이런 transform
// 조상이 없어서 발생하지 않는, 순전히 이 미리보기 프레임만의 문제). body로
// 포탈링하면 그 transform 조상을 벗어나므로 실제 앱과 동일하게 렌더링됨 -
// Modal 컴포넌트 자체나 props 사용법을 바꾸는 게 아니라 마운트 위치만 다르게
// 함.
export function Open() {
  return createPortal(
    <Modal isOpen onClose={() => {}}>
      <div
        className="w-full max-w-xs rounded-2xl border p-5"
        style={{ backgroundColor: "var(--ink)", borderColor: "var(--line)" }}
      >
        <h2 className="text-base font-bold text-(--paper)">
          정말 취소하시겠어요?
        </h2>
        <p className="mt-2 text-sm text-(--muted)">
          취소하면 다시 신청해야 할 수도 있어요.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border px-4 py-3 text-sm font-semibold text-(--paper)"
            style={{ borderColor: "var(--line)" }}
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-3 text-sm font-semibold text-(--on-yellow)"
            style={{ backgroundColor: "var(--brand-yellow)" }}
          >
            확인
          </button>
        </div>
      </div>
    </Modal>,
    document.body,
  );
}
