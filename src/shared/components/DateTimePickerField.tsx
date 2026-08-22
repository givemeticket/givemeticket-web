import { useState } from "react";
import { ChevronLeftIcon } from "./BackButton";
import { WheelColumn, ROW_HEIGHT, WHEEL_PADDING } from "./WheelColumn";
import {
  parseDatetimeLocalValue as parseValue,
  buildDatetimeLocalValueFromParts as toValue,
} from "@/shared/lib/formatDate";

interface DateTimePickerFieldProps {
  label: string;
  /** datetime-local과 동일한 "YYYY-MM-DDTHH:mm" 형식 (기존 코드와 값 형태를 맞추기 위함) */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** 선택 가능한 최소 날짜. 기본은 오늘. 이미 지난 날짜를 그대로 유지하는 것도
   * 허용해야 하는 경우(예: 이미 오픈된 캠페인의 오픈시각을 그대로 두는 것) 오버라이드용 */
  minDate?: Date;
  /** true면 모달을 열 때 현재 value 대신 항상 "오늘/지금"으로 시작함
   * (예: 캠페인 수정 폼 — 원래 값은 유지하되, 수정하러 들어왔을 때는 현재 시각부터 보여주고 싶은 경우) */
  resetToNowOnOpen?: boolean;
  /** 실제로 저장돼 있는 원래 값. resetToNowOnOpen과 함께 쓰면
   * (1) 달력에 이 날짜를 별도 표시하고 (2) 닫힌 라벨에 되돌리기 버튼을 보여줌 */
  originalValue?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(value: string): string {
  const d = new Date(value);
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("ko-KR", {
    year: isThisYear ? undefined : "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

function formatTimeLabel(value: string): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/** 24시간제 → { 12시간제 시, 오전/오후(0|1) } */
function to12Hour(hour24: number): { hour12: number; meridiem: 0 | 1 } {
  const meridiem: 0 | 1 = hour24 < 12 ? 0 : 1;
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, meridiem };
}

/** { 12시간제 시, 오전/오후 } → 24시간제 */
function to24Hour(hour12: number, meridiem: 0 | 1): number {
  const base = hour12 % 12;
  return meridiem === 1 ? base + 12 : base;
}

const MERIDIEM_ITEMS = [
  { value: 0, label: "오전" },
  { value: 1, label: "오후" },
];
const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));
const MINUTE_ITEMS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, "0"),
}));

// 네이티브 <input type="datetime-local"> 대신 쓰는 커스텀 날짜/시간 선택기.
// 필드를 누르면 모달로 달력 + 스크롤 타임휠(오전오후/시/분)이 뜨고,
// "확인"을 눌러야 값이 반영됨.
export function DateTimePickerField({
  label,
  value,
  onChange,
  hint,
  minDate,
  resetToNowOnOpen = false,
  originalValue,
}: DateTimePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => parseValue(value).date);
  const [draftDate, setDraftDate] = useState<Date>(
    () => parseValue(value).date,
  );
  const [draftHour, setDraftHour] = useState(() => parseValue(value).hour);
  const [draftMinute, setDraftMinute] = useState(
    () => parseValue(value).minute,
  );

  function openModal() {
    // resetToNowOnOpen이면 원래 값이 뭐였든 상관없이 항상 "지금"부터 보여줌.
    // 실제 저장된 값(value)은 "확인"을 눌러야만 이걸로 덮어써짐 — 안 누르고
    // "취소"하면 이 화면에서 뭘 골랐든 기존 value 그대로 유지됨.
    const parsed = resetToNowOnOpen ? parseValue("") : parseValue(value);
    setViewMonth(parsed.date);
    setDraftDate(parsed.date);
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setIsOpen(true);
  }

  function handleConfirm() {
    onChange(toValue(draftDate, draftHour, draftMinute));
    setIsOpen(false);
  }

  const { hour12, meridiem } = to12Hour(draftHour);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minSelectableDate = minDate ? new Date(minDate) : new Date();
  minSelectableDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 원래 저장돼 있던 날짜. 오늘이랑 같으면 굳이 표시할 필요 없음(이미 기본 선택 위치니까)
  const originalDate = originalValue
    ? (() => {
        const d = new Date(originalValue);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      })()
    : null;
  const showOriginalMarker =
    originalDate && originalDate.getTime() !== today.getTime();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const displayValue = value || toValue(draftDate, draftHour, draftMinute);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-(--paper)">{label}</span>

      <div
        role="button"
        tabIndex={0}
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openModal();
          }
        }}
        className="input flex cursor-pointer items-center gap-2 text-left"
      >
        <CalendarIcon />
        <span className="min-w-0 flex-1 truncate text-(--paper)">
          {formatDateLabel(displayValue)}
          <span className="mx-1.5 text-(--muted)">·</span>
          {formatTimeLabel(displayValue)}
        </span>

        {originalValue && value !== originalValue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(originalValue);
            }}
            aria-label="원래 시각으로 되돌리기"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full hover:bg-(--ink-soft)"
            style={{ color: "var(--muted)" }}
          >
            <RevertIcon />
          </button>
        )}
      </div>

      {hint && <span className="text-xs text-(--muted)">{hint}</span>}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border p-4"
            style={{
              backgroundColor: "var(--ink)",
              borderColor: "var(--line)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 월 이동 헤더 */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-(--ink-soft)"
                aria-label="이전 달"
              >
                <ChevronLeftIcon />
              </button>
              <span className="text-sm font-semibold text-(--paper)">
                {year}년 {month + 1}월
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-(--ink-soft)"
                aria-label="다음 달"
                style={{ transform: "rotate(180deg)" }}
              >
                <ChevronLeftIcon />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-(--muted)">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (day === null) return <span key={idx} />;
                const cellDate = new Date(year, month, day);
                const isPast = cellDate < minSelectableDate;
                const isSelected = cellDate.getTime() === draftDate.getTime();
                const isOriginal =
                  showOriginalMarker &&
                  originalDate &&
                  cellDate.getTime() === originalDate.getTime();
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPast}
                    onClick={() => setDraftDate(cellDate)}
                    className="aspect-square rounded-full text-sm disabled:opacity-30"
                    style={
                      isSelected
                        ? {
                            backgroundColor: "var(--brand-blue)",
                            color: "var(--on-brand)",
                          }
                        : isOriginal
                          ? {
                              color: "var(--paper)",
                              boxShadow: "inset 0 0 0 1.5px var(--brand-blue)",
                            }
                          : { color: "var(--paper)" }
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* 시간 타임휠 */}
            <div className="relative mt-4 flex justify-center gap-1">
              <div
                className="pointer-events-none absolute inset-x-3 rounded-xl"
                style={{
                  top: WHEEL_PADDING,
                  height: ROW_HEIGHT,
                  backgroundColor: "var(--ink-soft)",
                  boxShadow: "inset 0 0 0 1.5px var(--brand-blue)",
                }}
              />
              <WheelColumn
                items={MERIDIEM_ITEMS}
                selectedValue={meridiem}
                onChange={(m) => setDraftHour(to24Hour(hour12, m as 0 | 1))}
                circular={false}
              />
              <WheelColumn
                items={HOUR_ITEMS}
                selectedValue={hour12}
                onChange={(h) => setDraftHour(to24Hour(h, meridiem))}
                circular={false}
              />
              <span className="flex items-center text-sm text-(--muted)">
                :
              </span>
              <WheelColumn
                items={MINUTE_ITEMS}
                selectedValue={draftMinute}
                onChange={setDraftMinute}
              />
            </div>

            {/* 액션 버튼 */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-full border px-4 py-2.5 text-sm font-medium"
                style={{ borderColor: "var(--line)", color: "var(--paper)" }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-(--on-yellow)"
                style={{ backgroundColor: "var(--brand-yellow)" }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="5"
        width="17"
        height="16"
        rx="2.5"
        stroke="var(--brand-blue)"
        strokeWidth="1.6"
      />
      <path d="M3.5 9.5h17" stroke="var(--brand-blue)" strokeWidth="1.6" />
      <path
        d="M8 3v3.5M16 3v3.5"
        stroke="var(--brand-blue)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RevertIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 4v6h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 15a8 8 0 1 0 2-8.5L4 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
