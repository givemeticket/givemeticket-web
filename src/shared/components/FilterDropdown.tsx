import { useEffect, useRef, useState } from "react";
import { ToggleSwitch } from "./ToggleSwitch";

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
// 한 번에 다루는 드롭다운. 지금은 UI만 있고 실제 목록 정렬에는 반영 안 됨
// (백엔드가 정렬에 필요한 시각 필드를 내려주면 그때 연결 예정).
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

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

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
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="정렬 및 필터"
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isOpen ? "" : "hover:bg-(--ink-soft)"
        }`}
        style={{
          color: isOpen ? "var(--brand-blue)" : "var(--muted)",
          backgroundColor: isOpen ? "var(--ink-soft)" : undefined,
        }}
      >
        <FilterIcon />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-10 z-20 w-52 rounded-xl border p-3"
          style={{
            borderColor: "var(--line)",
            backgroundColor: "var(--ink)",
            boxShadow: "0 10px 24px rgba(17,24,39,0.12)",
          }}
        >
          <p className="mb-1.5 text-xs font-semibold text-(--muted)">
            정렬 기준
          </p>
          <div className="flex gap-1.5">
            {sortOptions.map((opt) => {
              const active = opt.value === sortValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleOptionClick(opt.value)}
                  className="flex flex-1 items-center justify-between gap-1 rounded-full border px-2.5 py-1.5 text-xs font-medium"
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
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={
          direction === "asc"
            ? "M12 19V5M6 11l6-6 6 6"
            : "M12 5v14M6 13l6 6 6-6"
        }
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
