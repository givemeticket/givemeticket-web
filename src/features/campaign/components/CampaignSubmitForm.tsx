import type { ReactNode, SubmitEvent } from "react";
import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";

interface CampaignSubmitFormProps {
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  /** 보통 CampaignFormFields — 필드 구성 자체는 각 페이지(추가/수정)가
   * prop을 다르게 넘기며 그대로 소유함 */
  children: ReactNode;
  errorMessage: string;
  isSubmitting: boolean;
  isFormValid: boolean;
  submitLabel: string;
  /** 제출 중일 때 버튼에 대신 보여줄 문구 (예: "추가 중...", "저장 중...") */
  submittingLabel: string;
}

// CampaignCreatePage.tsx/CampaignEditPage.tsx가 토씨까지 똑같이 들고 있던
// "<form> 뼈대(카드 테두리) + 에러 문구 + 오른쪽 정렬 제출 버튼"만 뽑음.
// 두 페이지의 실제 차이(스크롤 오프셋 보정 wrapper 유무, 필드 자체의
// min/힌트 등)는 이 컴포넌트 바깥/children으로 그대로 남아있어서, 여긴
// 정말 "폼 뼈대" 하나만 책임짐.
export function CampaignSubmitForm({
  onSubmit,
  children,
  errorMessage,
  isSubmitting,
  isFormValid,
  submitLabel,
  submittingLabel,
}: CampaignSubmitFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 flex flex-col gap-6 rounded-2xl border p-6"
      style={{ borderColor: "var(--line)" }}
    >
      {children}

      {errorMessage && <p className="text-xs text-(--warn)">{errorMessage}</p>}

      <div className="self-end">
        <PrimaryButton type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </PrimaryButton>
      </div>
    </form>
  );
}
