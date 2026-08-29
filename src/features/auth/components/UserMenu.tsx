import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/shared/components/Avatar";
import { useClickOutside } from "@/shared/hooks/useClickOutside";

interface UserMenuProps {
  /** null이면 비로그인 상태 — 드롭다운에 로그인 버튼만 뜸 */
  me: { nickname: string; profileImageUrl?: string | null } | null;
  onLogout: () => void;
  onWithdraw: () => void;
}

// 헤더에 아바타만 보이고, 누르면 드롭다운이 뜸. 로그인 상태면 닉네임/로그아웃/회원탈퇴,
// 비로그인 상태면 로그인 버튼만 보여줌. "바깥 클릭하면 닫기" 로직은 useClickOutside
// 훅으로 분리해서 씀 (다른 드롭다운류 컴포넌트에서도 재사용할 수 있게).
export function UserMenu({ me, onLogout, onWithdraw }: UserMenuProps) {
  const navigate = useNavigate();
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
        <Avatar src={me?.profileImageUrl} name={me?.nickname} size={24} />
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

          {me ? (
            <>
              <p className="truncate px-2.5 py-1.5 text-sm font-medium text-(--paper)">
                {me.nickname}님
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
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/");
              }}
              className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm font-medium text-(--paper) hover:bg-(--ink-soft)"
            >
              로그인
            </button>
          )}
        </div>
      )}
    </div>
  );
}
