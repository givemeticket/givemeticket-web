interface SortOption {
  value: string;
  label: string;
}

interface SortToggleProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}

// 정렬 기준을 고르는 토글. 지금은 UI만 있고 실제 목록 정렬에는 아직 반영 안 됨.
export function SortToggle({ options, value, onChange }: SortToggleProps) {
  return (
    <div className="flex gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
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
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
