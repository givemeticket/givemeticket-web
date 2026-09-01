import { useState, useSyncExternalStore } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useMe } from "@/features/auth/hooks/useMe";
import { withdrawUser } from "@/features/auth/api/authApi";
import { clearAccessToken } from "@/shared/lib/authToken";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import {
  getIsPageTransitioning,
  subscribeToPageTransition,
} from "@/shared/lib/pageTransitionStore";
import { useBlockUserScroll } from "@/shared/hooks/useBlockUserScroll";

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
  // 페이지 전환 중이면(탭 전환/카드 이동 포함, 어떤 애니메이션이든) 화면 전체가
  // 클릭 안 먹히게 함. 예전엔 각 페이지가 useIsPresent()로 각자 자기 안에서만
  // 처리했는데, 탭 전환처럼 AnimatePresence 키 자체가 안 바뀌는 전환(useIsPresent가
  // 계속 true라 안 걸림)은 못 잡았음. 여기 최상위(UserAppShell)에 딱 하나만 두면
  // 페이지 종류/전환 방식과 무관하게 항상 똑같이 적용됨.
  const isTransitioning = useSyncExternalStore(
    subscribeToPageTransition,
    getIsPageTransitioning,
  );
  // 전환 중엔 사용자가 직접 스크롤(휠/터치/키보드)하는 것도 막음 — 애니메이션
  // 도중 스크롤이 개입되면 스크롤 오프셋 보정(scrollOffsetStore.ts)의 전제가
  // 깨지면서 애니메이션이 이상하게 튀는 문제가 있었음. 클릭 차단이랑 똑같은
  // 신호(isTransitioning)를 그대로 씀 — "지금은 화면을 건드리면 안 되는 상태"라는
  // 느낌을 일관되게 주려고.
  useBlockUserScroll(isTransitioning);

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
    <div className="relative flex min-h-screen flex-col bg-(--ink) text-(--paper)">
      {isTransitioning && <div className="absolute inset-0 z-999" />}

      {/* sticky로 화면 상단에 고정 — 스크롤 오프셋 보정(scrollOffsetStore.ts) 때문에
          목록→상세 전환 애니메이션 내내 실제 브라우저 스크롤이 목록의 스크롤값(예:
          579px)에 그대로 머물러 있는데, 헤더가 문서 맨 위(y=0)에 그냥 놓여있으면
          그동안 화면 밖으로 밀려나 있다가 애니메이션이 끝나고 스크롤이 0으로
          돌아오는 순간 갑자기 나타나는 것처럼 보였음(사실 페이드 문제가 아니라
          스크롤 위치 문제였음). sticky면 스크롤 값과 무관하게 항상 화면에 보여서
          이 문제 자체가 없어짐. bg-(--ink)를 명시적으로 줘야 함 — 안 그러면 sticky로
          고정된 상태에서 스크롤되는 콘텐츠가 투명한 헤더 뒤로 비쳐 보임. */}
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-2xl items-center gap-2 bg-(--ink) px-6 pt-8">
        <BrandLogo />

        <div className="ml-auto flex items-center">
          <UserMenu
            me={me ?? null}
            onLogout={logout}
            onWithdraw={() => setIsWithdrawConfirmOpen(true)}
          />
        </div>
      </header>

      {/* 헤더가 자기 높이만큼만 차지하고, 이 영역이 남은 공간을 정확히 채움 —
          안 그러면(예: 아래 페이지들이 각자 min-h-screen을 쓰면) 헤더 높이만큼
          화면 전체 높이가 이중으로 잡혀서, 콘텐츠가 짧아도 헤더 높이만큼 여분의
          스크롤이 생기는 문제가 있었음. 아래 페이지들은 이제 이 영역 안에서
          h-full로 이 남은 공간을 채우면 됨(min-h-screen 대신). */}
      <div className="flex-1">
        <Outlet />
      </div>

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
