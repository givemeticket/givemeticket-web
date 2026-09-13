import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "../buttons/IconButton";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface MonthCalendarProps {
  /** 지금 펼쳐서 보고 있는 달. day는 의미 없고 연/월만 씀 */
  viewMonth: Date;
  onViewMonthChange: (date: Date) => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** 이 날짜보다 이전 칸은 비활성화 */
  minSelectableDate: Date;
  /** 파란 테두리로 별도 표시할 날짜(예: 수정 폼에서 원래 저장돼 있던 날짜).
   * null/undefined면 표시 안 함 — "표시할 필요가 있는지"(오늘과 같은 날이면
   * 표시할 필요 없음 등) 판단은 호출부(DateTimePickerField.tsx)가 미리 하고
   * 넘겨줌 */
  markedDate?: Date | null;
}

// DateTimePickerField.tsx의 달력 부분(월 이동 헤더 + 요일 헤더 + 날짜 그리드)만
// 떼어냄 — 시간 타임휠(WheelColumn) 쪽의 스크롤/제스처 로직과는 완전히 무관한
// 순수 렌더링이라 분리해도 리스크 없음. "어떤 달을 보여줄지"/"뭘 선택했는지"
// 자체는 여전히 부모가 갖고 있음(모달을 열 때 리셋하거나 확인 시 최종값을
// 읽어야 해서) — 이 컴포넌트는 그 값들을 받아서 그리기만 함.
export function MonthCalendar({
  viewMonth,
  onViewMonthChange,
  selectedDate,
  onSelectDate,
  minSelectableDate,
  markedDate,
}: MonthCalendarProps) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      {/* 월 이동 헤더 */}
      <div className="flex items-center justify-between">
        <IconButton
          onClick={() => onViewMonthChange(new Date(year, month - 1, 1))}
          label="이전 달"
          size="sm"
        >
          <ChevronLeft size={16} />
        </IconButton>
        <span className="text-sm font-semibold text-(--paper)">
          {year}년 {month + 1}월
        </span>
        <IconButton
          onClick={() => onViewMonthChange(new Date(year, month + 1, 1))}
          label="다음 달"
          size="sm"
        >
          <ChevronRight size={16} />
        </IconButton>
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
          const isSelected = cellDate.getTime() === selectedDate.getTime();
          const isMarked =
            markedDate && cellDate.getTime() === markedDate.getTime();
          return (
            <button
              key={idx}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(cellDate)}
              className="aspect-square rounded-full text-sm disabled:opacity-30"
              style={
                isSelected
                  ? {
                      backgroundColor: "var(--brand-blue)",
                      color: "var(--on-brand)",
                    }
                  : isMarked
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
    </>
  );
}
