import { ArrowDown, ArrowUp } from "lucide-react";

interface SortOption {
  value: string;
  label: string;
}

interface InlineSortFilterProps {
  sortOptions: SortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  /** true면 만료(삭제됨/종료됨)된 행사만, false면 만료 안 된 행사만 보여줌 */
  showExpiredOnly: boolean;
  onShowExpiredOnlyChange: (checked: boolean) => void;
}

// 정렬 기준/방향 + 만료 행사만 보기를 드롭다운 없이 가로로 펼쳐서 항상 보이게 하는
// 대시보드 목록용 필터 UI. "만료" 버튼도 정렬 버튼들이랑 똑같은 알약 버튼 디자인으로
// 통일함(선택=파란 배경, 아니면 테두리만).
export function InlineSortFilter({
  sortOptions,
  sortValue,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  showExpiredOnly,
  onShowExpiredOnlyChange,
}: InlineSortFilterProps) {
  // 이미 선택된 기준을 다시 누르면 방향만 뒤집고, 다른 기준을 누르면
  // 그걸로 선택 전환하면서 방향은 내림차순으로 초기화
  function handleOptionClick(value: string) {
    if (value === sortValue) {
      onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(value);
      onSortDirectionChange("desc");
    }
  }

  const pillClass =
    "flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium";
  const activeStyle = {
    backgroundColor: "var(--brand-blue)",
    borderColor: "var(--brand-blue)",
    color: "var(--on-brand)",
  };
  const inactiveStyle = { borderColor: "var(--line)", color: "var(--muted)" };

  return (
    <div className="flex items-center gap-1.5">
      {sortOptions.map((opt) => {
        const active = opt.value === sortValue;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleOptionClick(opt.value)}
            className={pillClass}
            style={active ? activeStyle : inactiveStyle}
          >
            <span>{opt.label}</span>
            {active &&
              (sortDirection === "asc" ? (
                <ArrowUp size={12} strokeWidth={2} />
              ) : (
                <ArrowDown size={12} strokeWidth={2} />
              ))}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onShowExpiredOnlyChange(!showExpiredOnly)}
        className={pillClass}
        style={showExpiredOnly ? activeStyle : inactiveStyle}
      >
        만료
      </button>
    </div>
  );
}
