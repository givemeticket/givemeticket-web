import { useState, useSyncExternalStore } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/shared/components/BrandLogo";
import { HeaderTabs } from "@/features/dashboard/components/HeaderTabs";
import { HeaderLiveClock } from "@/features/dashboard/components/HeaderLiveClock";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useMe } from "@/features/auth/hooks/useMe";
import { withdrawUser } from "@/features/auth/api/authApi";
import { clearAccessToken } from "@/shared/lib/authToken";
import { ConfirmDialog } from "@/shared/components/overlay/ConfirmDialog";
import {
  getIsPageTransitioning,
  subscribeToPageTransition,
} from "@/shared/animation/pageTransition/pageTransitionStore";
import { useBlockUserScroll } from "@/shared/animation/hooks/useBlockUserScroll";

// OAuth 콜백 화면과 "/"의 비로그인용 안내 화면(LandingPage)을 뺀 모든 화면이
// 공유하는 최상위 레이아웃. 로고+탭+아바타 헤더가 여기 있어서, 리액트
// 라우터의 중첩 레이아웃 성질상 하위 라우트(RootLayout, 대시보드, 캠페인
// 상세 등)가 아무리 바뀌어도 이 컴포넌트 자체는 리마운트되지 않음 — 그래서
// 헤더가 페이지 전환 애니메이션의 영향을 전혀 안 받고 항상 고정으로 보임
// (예전엔 각 페이지가 헤더를 따로 들고 있어서 페이지 전환마다 같이 사라졌다
// 나타났었음).
//
// "/"는 예전엔 이 트리 바깥의 완전히 별개 라우트였는데(비로그인이면
// LandingPage, 로그인이면 /mytickets로 즉시 리다이렉트라 "/" 자체엔 콘텐츠가
// 없었음), 로그인 상태에서 "/"에 "홈" 탭 콘텐츠를 보여주는 라우팅 구조 확장
// 이후로는 "/"도 이 트리 **안**의 정상 라우트가 됐음(RootRoute.tsx 참고,
// docs/animation.md 13번 — 트리 바깥 경로로 다니면 이 컴포넌트가
// 언마운트/재마운트돼서 위 "리마운트 안 됨" 불변조건이 깨짐). 대신 "/" +
// 비로그인일 때만 헤더 자체를 그리지 않도록 이 컴포넌트가 직접 판단함(아래
// hideShellChrome) — 그래야 게스트에게는 지금처럼 헤더 없는 풀스크린
// 안내 화면이 그대로 보이면서도, UserAppShell 인스턴스 자체는 절대
// 리마운트되지 않음.
//
// 탭(홈/찜한 행사/나의 티켓/나의 행사)도 원래 DashboardLayout 안에서 대시보드
// 라우트일 때만 조건부로 보이던 걸 여기로 옮겨서 항상 보이게 함(HeaderTabs.tsx
// 참고) — 어느 화면에서든 바로 대시보드로 이동할 수 있는 전역 내비게이션으로
// 성격이 바뀜. 활성 탭 표시(아이콘+알약 배경)는 HeaderTabs.tsx가 담당함 —
// 자세한 이력/이유는 그 파일 주석 참고.
//
// 비로그인 상태에서도(예: 공유 링크로 캠페인 상세를 보는 게스트) 아바타/탭은 항상
// 보이고, 탭을 누르면 ProtectedRoute가 알아서 로그인으로 보냈다가 되돌려줌
// (UserMenu가 me=null을 처리하는 것과 같은 원칙 — 로그인 상태를 여기서 미리
// 따지지 않고, 각자 필요한 곳에서 자연스럽게 처리되게 둠). "/"만 예외적으로
// 로그인 여부를 직접 따지는 건, "/"가 유일하게 "로그인 여부로 헤더 유무
// 자체가 갈리는" 화면이라서임 — 다른 화면들은 헤더는 항상 뜨고 콘텐츠
// 접근만 ProtectedRoute가 가로채는 것과 성격이 다름.
export function UserAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
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

  // "/" + 비로그인이면 이 컴포넌트가 그리는 헤더/탈퇴 다이얼로그 등 아무것도
  // 없이 자식(LandingPage)을 그대로 통과시킴 — 위 컴포넌트 설명 주석 참고.
  // 이 조기 반환은 반드시 위의 모든 훅 호출 다음, 실제 헤더 JSX를 그리는
  // return보다 앞에 둬야 함(훅은 매 렌더 항상 같은 순서로 호출돼야 하는
  // 규칙 — 훅 자체를 조건부로 건너뛰면 안 되지만, 훅을 다 부른 뒤 반환값을
  // 조건부로 쓰는 건 안전함).
  if (location.pathname === "/" && !isAuthenticated) {
    return <Outlet />;
  }

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
          고정된 상태에서 스크롤되는 콘텐츠가 투명한 헤더 뒤로 비쳐 보임.

          이 헤더는 pt-8만 있고 원래 bottom padding이 없었음 — 아래 여백은 이
          헤더가 아니라 그다음에 오는 각 페이지 쪽(DashboardLayout의 main,
          CampaignSubPageShell/CampaignDetailPage의 pt-8)이 대신 만들어주고
          있었음. 스크롤 안 한 상태에선 둘 다 똑같이 "빈 여백"이라
          구분이 안 갔는데, sticky로 고정된 채 스크롤하면 그 아래 여백은
          콘텐츠와 함께 스크롤되어 사라지고 헤더만 화면에 남아서, 헤더 바로
          밑에 다른 콘텐츠가 여백/경계 없이 바로 붙어버리는 것처럼 보였음.
          border-b + pb-8를 헤더 자신에게 줘서, 스크롤 여부와 무관하게 헤더
          스스로 항상 뚜렷한 경계를 갖게 함(각 페이지의 자체 여백은 안
          건드림 — 그 경계 밑에 원래 있던 그 페이지 여백이 그대로 추가로
          더해지는 것뿐이라, 다른 곳을 손볼 필요가 없음).

          구분선(border-b)은 header 자신이 아니라, 안쪽에 새로 둔 div에
          줌 — 안쪽 div가 header의 좌우 패딩(px-6) 안쪽 영역을 그대로
          차지하므로, 그 div에 테두리를 주면 패딩을 뺀 실제 콘텐츠 폭에
          정확히 맞춰짐(header 자체에 테두리를 주면 패딩 바깥쪽까지
          꽉 차게 그려짐).

          예전엔 header 자체를 max-w-220(880px)으로 페이지 콘텐츠 폭에
          맞춰서, 헤더와 그 아래 각 페이지 콘텐츠의 좌우 경계선이 시각적으로
          한 줄로 이어지게 했었음. 그런데 templates/home-overview 템플릿은
          헤더를 항상 화면 끝까지 꽉 채우는 형태였고, 사용자가 이 쪽을
          택함(2026-09-12) — 그래서 max-w를 없애고 header가 항상 w-full로
          화면 전체 폭을 채우게 바꿈. 그 결과 헤더와 아래 페이지 콘텐츠(대부분
          880px으로 가운데 정렬됨)의 좌우 경계가 더 이상 한 줄로 안
          맞는데, 이건 이번 변경으로 의도된 트레이드오프임. */}
      <header className="sticky top-0 z-40 w-full bg-(--ink) px-6 pt-8">
        {/* border-(--line) 대신 rgba를 직접 줌 — --line은 인풋/카드 등 앱 전체가
            공유하는 토큰이라, 여기서 더 진하게 바꾸면 그 값을 쓰는 다른 모든
            테두리도 같이 진해짐. 이 헤더 구분선만 살짝 더 진하게 하려고
            별도 값(0.1 → 0.16)을 씀. */}
        <div className="border-b-2 border-dashed border-[rgba(17,24,39,0.16)] pb-8">
          {/* relative를 pb-8 있는 바깥 div가 아니라 이 안쪽 div에 둠 — 바깥
              div에 두면 absolute 시계의 top-1/2가 pb-8(구분선 아래 여백)까지
              포함한 전체 높이 기준으로 계산돼서, 로고/탭보다 아래로 처져
              보였음. 이 안쪽 div는 패딩이 없어서, 그 높이가 곧 로고/탭/아바타
              콘텐츠 자체의 높이라 top-1/2가 정확히 그 콘텐츠들과 같은
              세로 중앙에 맞음. */}
          <div className="relative flex items-center gap-4">
            <BrandLogo />
            <HeaderTabs />

            {/* templates/home-overview 참고 — 헤더 한가운데 실시간(서버 보정)
                시계. absolute + 부모 relative로 중앙 고정해서, 좌측
                로고+탭/우측 아바타의 폭이 로그인 상태 등에 따라 달라져도
                항상 헤더 정중앙에 위치함(flex 자식으로 두면 양쪽 폭 차이만큼
                중앙에서 밀려남). */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <HeaderLiveClock />
            </div>

            <div className="ml-auto flex items-center">
              <UserMenu
                me={me ?? null}
                onLogout={logout}
                onWithdraw={() => setIsWithdrawConfirmOpen(true)}
              />
            </div>
          </div>
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
