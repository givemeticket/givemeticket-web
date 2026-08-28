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
// "바깥 클릭하면 닫기" 로직은 useClickOutside 훅으로 분리해서 씀 (다른 드롭다운류
// 컴포넌트에서도 재사용할 수 있게).
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
          {/* 말풍선 꼬리 — 45도 회전시킨 작은 정사각형. 왼쪽/위쪽 테두리만 패널이랑
              같은 색으로 줘서, 회전했을 때 그 두 변만 위쪽을 향하게(패널에서 이어지는
              모서리처럼) 만듦 */}
          <div
            className="absolute -top-1.5 right-3 h-3 w-3 rotate-45 rounded-xs border-l border-t"
            style={{
              backgroundColor: "var(--ink)",
              borderColor: "var(--line)",
            }}
          />

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
