import { useState } from "react";
import { ChevronLeftIcon } from "./BackButton";

interface DateTimePickerFieldProps {
  label: string;
  /** datetime-local과 동일한 "YYYY-MM-DDTHH:mm" 형식 (기존 코드와 값 형태를 맞추기 위함) */
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function parseValue(value: string): {
  date: Date | null;
  hour: number;
  minute: number;
} {
  if (!value) return { date: null, hour: 12, minute: 0 };
  const d = new Date(value);
  return {
    date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

function formatDisplay(value: string): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function toValue(date: Date, hour: number, minute: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}`;
}

// 네이티브 <input type="datetime-local"> 대신 쓰는 커스텀 날짜/시간 선택기.
// 필드를 누르면 모달로 달력+시간 선택 UI가 뜨고, "확인"을 눌러야 값이 반영됨.
export function DateTimePickerField({
  label,
  value,
  onChange,
  hint,
}: DateTimePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    () => parseValue(value).date ?? new Date(),
  );
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [draftHour, setDraftHour] = useState(12);
  const [draftMinute, setDraftMinute] = useState(0);

  function openModal() {
    const parsed = parseValue(value);
    setViewMonth(parsed.date ?? new Date());
    setDraftDate(parsed.date);
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setIsOpen(true);
  }

  function handleConfirm() {
    if (!draftDate) return;
    onChange(toValue(draftDate, draftHour, draftMinute));
    setIsOpen(false);
  }

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-(--paper)">{label}</span>
      <button
        type="button"
        onClick={openModal}
        className="input text-left"
        style={{ color: value ? "var(--paper)" : "var(--muted)" }}
      >
        {value ? formatDisplay(value) : "날짜와 시간을 선택하세요"}
      </button>
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
                const isPast = cellDate < today;
                const isSelected =
                  draftDate && cellDate.getTime() === draftDate.getTime();
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
                        : { color: "var(--paper)" }
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* 시간 선택 */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <select
                value={draftHour}
                onChange={(e) => setDraftHour(Number(e.target.value))}
                className="input w-20 text-center"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}시
                  </option>
                ))}
              </select>
              <select
                value={draftMinute}
                onChange={(e) => setDraftMinute(Number(e.target.value))}
                className="input w-20 text-center"
              >
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, "0")}분
                  </option>
                ))}
              </select>
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
                disabled={!draftDate}
                className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-(--on-yellow) disabled:opacity-40"
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
