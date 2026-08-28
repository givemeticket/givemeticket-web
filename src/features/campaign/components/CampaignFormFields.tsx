import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { DateTimePickerField } from "@/shared/components/DateTimePickerField";
import { Tooltip } from "@/shared/components/Tooltip";

interface CampaignFormFieldsProps {
  title: string;
  onTitleChange: (v: string) => void;
  titlePlaceholder?: string;

  totalStock: string;
  onTotalStockChange: (v: string) => void;
  /** 수정 시 "이미 오픈된 캠페인은 정원을 못 줄임" 같은 제약 있으면 넘김 */
  totalStockMin?: number;
  /** 정원 라벨 옆에 안내 아이콘+툴팁을 붙이고 싶을 때 그 문구 */
  totalStockInfo?: string;

  openAt: string;
  onOpenAtChange: (v: string) => void;
  /** 수정 시 "이미 오픈된 캠페인은 원래 시각보다 못 당김" 같은 제약 있으면 넘김 */
  openAtMinDate?: Date;
  openAtResetToNowOnOpen?: boolean;
  openAtOriginalValue?: string;
  /** 오픈시각 라벨 옆에 안내 아이콘+툴팁을 붙이고 싶을 때 그 문구 */
  openAtInfo?: string;
}

// 캠페인 생성 폼(CampaignCreatePage)이랑 수정 폼(OwnerPanel)이 제목/정원/오픈시각
// 세 필드를 그리는 부분이 똑같아서 공용으로 뺌. 값/제약조건/힌트는 전부 prop으로
// 받고, 검증 로직·제출 함수·상태별 제약 판단(수정 폼의 isOpen 분기 등)은 각 페이지가
// 그대로 따로 소유함 — 필드 렌더링만 공용, 나머지 로직은 각자 원칙.
export function CampaignFormFields({
  title,
  onTitleChange,
  titlePlaceholder = "GIVEMETICKET 캠페인",
  totalStock,
  onTotalStockChange,
  totalStockMin = 1,
  totalStockInfo,
  openAt,
  onOpenAtChange,
  openAtMinDate,
  openAtResetToNowOnOpen = false,
  openAtOriginalValue,
  openAtInfo,
}: CampaignFormFieldsProps) {
  return (
    <>
      <Field label="행사 이름">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={titlePlaceholder}
          maxLength={100}
          className="input"
        />
      </Field>

      <div className="flex gap-4">
        <div className="flex-1">
          <Field label="정원" info={totalStockInfo}>
            <input
              type="number"
              min={totalStockMin}
              value={totalStock}
              onChange={(e) => onTotalStockChange(e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="flex-1">
          <DateTimePickerField
            label="신청 오픈 시각"
            labelInfo={openAtInfo}
            value={openAt}
            onChange={onOpenAtChange}
            minDate={openAtMinDate}
            resetToNowOnOpen={openAtResetToNowOnOpen}
            originalValue={openAtOriginalValue}
          />
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  info,
  children,
}: {
  label: string;
  info?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-sm font-medium text-(--paper)">
        {label}
        {info && (
          <Tooltip content={info}>
            <CircleAlert size={14} strokeWidth={2} className="text-(--muted)" />
          </Tooltip>
        )}
      </span>
      {children}
    </label>
  );
}
