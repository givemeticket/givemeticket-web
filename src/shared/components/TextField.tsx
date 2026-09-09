import type { InputHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { Tooltip } from "@/shared/components/overlay/Tooltip";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** 라벨 옆에 안내 아이콘+툴팁을 붙이고 싶을 때 그 문구 */
  info?: string;
}

// 라벨 + 인풋 + (선택) 안내 툴팁 조합의 공용 폼 필드. 원래 CampaignFormFields.tsx
// 안에만 있던 로컬 컴포넌트를 공용으로 승격함 — 폼이 하나 더 생길 때마다 매번
// 라벨+인풋 마크업을 손으로 반복하지 않게 하려는 목적. type/value/onChange/
// placeholder/maxLength/min 같은 <input> 고유 속성은 전부 그대로 전달됨.
//
// 검색창처럼 아이콘을 안에 얹거나 라벨이 없는 형태, DateTimePickerField의
// 트리거처럼 실제로는 <input>이 아니라 버튼인 경우는 이 컴포넌트로 억지로
// 통일하지 않음 — 의미(semantics)가 다른 걸 하나의 컴포넌트로 합치면 오히려
// 둘 다 어중간해짐.
export function TextField({
  label,
  info,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-sm font-medium text-(--paper)">
        {label}
        {info && (
          <Tooltip content={info} placement="right" tapToShow>
            {/* 아이콘 자체(14px)는 그대로 두고, 실제 터치 가능 영역만 패딩으로
                넓힘(-m-2로 그 패딩만큼 다시 당겨서 레이아웃엔 영향 없게 함) —
                14px 그대로면 모바일에서 손가락으로 정확히 조준하기 어려워
                꾹 누르기 자체가 잘 안 먹히는 문제가 있었음(실측 확인함). */}
            <span className="-m-2 inline-flex p-2">
              <CircleAlert
                size={14}
                strokeWidth={2}
                className="text-(--muted)"
              />
            </span>
          </Tooltip>
        )}
      </span>
      <input className={`input ${className ?? ""}`} {...inputProps} />
    </label>
  );
}
