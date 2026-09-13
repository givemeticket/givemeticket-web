import type { ComponentType } from "react";
import { CalendarDays, Heart, Home, Ticket } from "lucide-react";
import type { FilterTab } from "../lib/dashboardFilterStore";
import { useTabLinkNavigation } from "../hooks/useTabLinkNavigation";

// claude.ai/design의 Mobile Screens 템플릿에 있는 화면 하단 고정 탭 바 —
// 모바일(640px 미만) 전용. 데스크톱에서는 같은 4개 탭이 헤더(HeaderTabs.tsx)에
// 그대로 남아있고, 여긴 그 헤더 탭을 숨기는 대신 나타나는 짝임(둘 다 항상
// DOM에 있고 Tailwind 반응형 클래스로 표시만 바뀜 — UserAppShell.tsx 참고).
// 탭 목록/활성 판정/클릭 시 동작은 useTabLinkNavigation 훅으로 헤더 탭과
// 공유하므로, 여긴 순전히 "세로로 아이콘+라벨을 쌓은" 모양만 다르게 그림.
//
// position:fixed라 문서 스크롤과 무관하게 항상 화면 맨 아래에 붙음 —
// UserAppShell.tsx가 콘텐츠 영역 하단에 이 바 높이만큼 padding을 미리
// 줘서, 페이지 마지막 내용이 이 바에 가려지지 않게 함. z-index(40)는
// 헤더와 같은 값 — 페이지 전환 중 전체 화면을 덮는 클릭 차단
// 오버레이(UserAppShell.tsx의 z-999)보다는 항상 아래에 있어야, 전환 중에
// 이 탭들을 눌러 애니메이션이 꼬이는 일이 없음.
export function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex sm:hidden"
      style={{ backgroundColor: "var(--ink)", borderTop: "1px solid var(--line)" }}
    >
      {/* env(safe-area-inset-bottom) — iOS 홈 인디케이터가 있는 기기에서
          탭 바가 그 위에 딱 붙어 가려지지 않도록 안전 영역만큼 아래
          여백을 더함. 그런 기기가 아니면(대부분의 경우) 0이라 평소엔
          아무 영향 없음. */}
      <div
        className="flex w-full"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* 홈/찜한 행사는 아직 정렬·필터 UI가 없는 placeholder라 tab prop을
            안 줌 — HeaderTabs.tsx와 동일한 이유. */}
        <BottomTabBarLink to="/" label="홈" icon={Home} />
        <BottomTabBarLink to="/mywish" label="찜한 행사" icon={Heart} />
        <BottomTabBarLink
          to="/mytickets"
          tab="mytickets"
          label="나의 티켓"
          icon={Ticket}
        />
        <BottomTabBarLink
          to="/mycampaigns"
          tab="mycampaigns"
          label="나의 행사"
          icon={CalendarDays}
        />
      </div>
    </nav>
  );
}

function BottomTabBarLink({
  to,
  tab,
  label,
  icon: Icon,
}: {
  to: string;
  tab?: FilterTab;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  const { isActive, handleClick } = useTabLinkNavigation(to, tab);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10.5px] transition-colors ${
        isActive ? "font-bold text-(--paper)" : "font-semibold text-(--muted)"
      }`}
    >
      <Icon size={21} strokeWidth={1.6} />
      {label}
    </button>
  );
}
