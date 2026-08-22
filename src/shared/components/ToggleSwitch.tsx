interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      // border-0/p-0/m-0로 브라우저 기본 버튼 스타일(테두리, 여백)을 확실히 초기화 —
      // 이게 안 지워지면 트랙 크기가 의도한 것보다 커지면서 원 위치가 어긋나 보임
      className="relative h-5 w-9 shrink-0 rounded-full border-0 p-0 m-0 outline-none transition-colors"
      style={{
        backgroundColor: checked ? "var(--brand-blue)" : "var(--deleted)",
      }}
    >
      <span
        className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform"
        style={{
          top: 2,
          left: 2,
          transform: checked ? "translateX(16px)" : "translateX(0)",
        }}
      />
    </button>
  );
}
