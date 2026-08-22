interface ShowDeletedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// "나의 티켓" / "내가 만든 행사" 탭이 공유하는 삭제된 행사 표시 여부 토글
export function ShowDeletedToggle({
  checked,
  onChange,
}: ShowDeletedToggleProps) {
  return (
    <label className="flex w-fit items-center gap-2 text-sm text-(--muted)">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-(--brand-blue)"
      />
      삭제된 행사 보기
    </label>
  );
}
