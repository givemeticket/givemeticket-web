import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Filter } from "lucide-react";
import { ToggleSwitch } from "./ToggleSwitch";
import { IconButton } from "./IconButton";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

interface SortOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  sortOptions: SortOption[];
  sortValue: string;
  onSortChange: (value: string) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  showDeleted: boolean;
  onShowDeletedChange: (checked: boolean) => void;
}

// 필터 아이콘 버튼 하나로 정렬 기준/오름차순·내림차순/삭제 항목 표시 여부를
// 한 번에 다루는 드롭다운. "오픈 날짜" 정렬만 실제로 목록에 반영됨(신청/만든 날짜는
// 서버가 이미 그 순서로 내려줘서 별도 정렬이 필요 없음) — CampaignListTab.tsx 참고.
export function FilterDropdown({
  sortOptions,
  sortValue,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  showDeleted,
  onShowDeletedChange,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // 이미 선택된 기준을 다시 누르면 방향만 뒤집고, 다른 기준을 누르면 그걸로 선택 전환
  function handleOptionClick(value: string) {
    if (value === sortValue) {
      onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc");
    } else {
      onSortChange(value);
      onSortDirectionChange("desc");
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <IconButton
        onClick={() => setIsOpen((v) => !v)}
        label="정렬 및 필터"
        size="sm"
        active={isOpen}
      >
        <Filter size={18} strokeWidth={1.8} />
      </IconButton>

      {isOpen && (
        <div
          className="absolute right-0 top-10 z-20 w-fit min-w-40 rounded-xl border p-3"
          style={{
            borderColor: "var(--line)",
            backgroundColor: "var(--ink)",
            boxShadow: "0 10px 24px rgba(17,24,39,0.12)",
          }}
        >
          <p className="mb-1.5 text-sm text-(--muted)">정렬 기준</p>
          <div className="flex gap-1.5">
            {sortOptions.map((opt) => {
              const active = opt.value === sortValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleOptionClick(opt.value)}
                  className="flex items-center gap-0.5 rounded-full border px-2.5 py-1.5 text-xs font-medium"
                  style={
                    active
                      ? {
                          backgroundColor: "var(--brand-blue)",
                          borderColor: "var(--brand-blue)",
                          color: "var(--on-brand)",
                        }
                      : { borderColor: "var(--line)", color: "var(--muted)" }
                  }
                >
                  <span className="whitespace-nowrap">{opt.label}</span>
                  {active && <SortDirectionIcon direction={sortDirection} />}
                </button>
              );
            })}
          </div>

          <div
            className="my-3 border-t"
            style={{ borderColor: "var(--line)" }}
          />

          <div className="flex items-center justify-between">
            <span className="text-sm text-(--muted)">삭제된 행사 표시</span>
            <ToggleSwitch
              checked={showDeleted}
              onChange={onShowDeletedChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SortDirectionIcon({ direction }: { direction: "asc" | "desc" }) {
  return direction === "asc" ? (
    <ArrowUp size={12} strokeWidth={2} />
  ) : (
    <ArrowDown size={12} strokeWidth={2} />
  );
}
