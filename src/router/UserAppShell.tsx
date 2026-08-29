import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useMe } from "@/features/auth/hooks/useMe";
import { withdrawUser } from "@/features/auth/api/authApi";
import { clearAccessToken } from "@/shared/lib/authToken";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

// 로그인/OAuth 콜백 화면을 뺀 모든 화면이 공유하는 최상위 레이아웃. 로고+아바타
// 헤더가 여기 있어서, 리액트 라우터의 중첩 레이아웃 성질상 하위 라우트(RootLayout,
// 대시보드, 캠페인 상세 등)가 아무리 바뀌어도 이 컴포넌트 자체는 리마운트되지
// 않음 — 그래서 헤더가 페이지 전환 애니메이션의 영향을 전혀 안 받고 항상 고정으로
// 보임 (예전엔 각 페이지가 헤더를 따로 들고 있어서 페이지 전환마다 같이 사라졌다
// 나타났었음).
//
// 비로그인 상태에서도(예: 공유 링크로 캠페인 상세를 보는 게스트) 아바타는 항상
// 보이고, 눌렀을 때 로그인 버튼만 뜨는 식으로 처리함 (UserMenu가 me=null을 처리함).
export function UserAppShell() {
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: me } = useMe();
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);

  // TODO: 테스트용 임시 버튼. 실제 회원탈퇴 플로우(탈퇴 사유 입력 등)는
  // 나중에 제대로 화면으로 뺄 예정. 지금은 API 동작 확인용.
  async function handleWithdraw() {
    try {
      await withdrawUser();
      clearAccessToken();
      navigate("/", { replace: true });
    } catch {
      alert("탈퇴 중 문제가 발생했어요.");
    }
  }

  return (
    <div className="min-h-screen bg-(--ink) text-(--paper)">
      <header className="mx-auto flex max-w-2xl items-center gap-2 px-6 pt-8">
        <BrandLogo />

        <div className="ml-auto flex items-center">
          <UserMenu
            me={me ?? null}
            onLogout={logout}
            onWithdraw={() => setIsWithdrawConfirmOpen(true)}
          />
        </div>
      </header>

      <Outlet />

      <ConfirmDialog
        isOpen={isWithdrawConfirmOpen}
        title="정말 탈퇴하시겠어요?"
        description="되돌릴 수 없어요."
        confirmLabel="탈퇴"
        danger
        onConfirm={() => {
          setIsWithdrawConfirmOpen(false);
          handleWithdraw();
        }}
        onCancel={() => setIsWithdrawConfirmOpen(false)}
      />
    </div>
  );
}
