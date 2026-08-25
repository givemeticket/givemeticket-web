import { useRef, useState } from "react";
import { Avatar } from "@/shared/components/Avatar";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

interface UserMenuProps {
  nickname: string;
  profileImageUrl?: string | null;
  onLogout: () => void;
  onWithdraw: () => void;
}

// 헤더에 아바타만 보이고, 누르면 닉네임/회원탈퇴/로그아웃이 드롭다운으로 뜸.
// FilterDropdown이랑 "바깥 클릭하면 닫기" 패턴이 겹쳐서 useClickOutside 훅으로 공유함.
export function UserMenu({
  nickname,
  profileImageUrl,
  onLogout,
  onWithdraw,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="내 계정 메뉴"
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-(--ink-soft)"
      >
        <Avatar src={profileImageUrl} name={nickname} size={24} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-10 z-20 w-40 rounded-xl border p-1.5"
          style={{
            borderColor: "var(--line)",
            backgroundColor: "var(--ink)",
            boxShadow: "0 10px 24px rgba(17,24,39,0.12)",
          }}
        >
          <p className="truncate px-2.5 py-1.5 text-sm font-medium text-(--paper)">
            {nickname}님
          </p>

          <div
            className="my-1 border-t"
            style={{ borderColor: "var(--line)" }}
          />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-(--muted) hover:bg-(--ink-soft) hover:text-(--paper)"
          >
            로그아웃
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onWithdraw();
            }}
            className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-(--muted) hover:bg-(--ink-soft) hover:text-(--warn)"
          >
            회원탈퇴
          </button>
        </div>
      )}
    </div>
  );
}
