import { useEffect, useRef, type ComponentProps } from "react";
import { MemoryRouter } from "react-router-dom";
import { UserMenu } from "@/features/auth/components/UserMenu";

// UserMenu는 열림 상태를 내부 useState로만 관리하고 외부에서 강제로 열
// prop이 없음. 마운트 직후 실제 트리거 버튼(아바타)을 진짜로 클릭해서 드롭다운이
// 열린 채로 캡처되게 함. useNavigate를 쓰므로 MemoryRouter로 감싸야 함.
function OpenedUserMenu(props: ComponentProps<typeof UserMenu>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector("button")?.click();
  }, []);
  return (
    <div ref={ref} className="flex justify-end p-8" style={{ minHeight: 160 }}>
      <UserMenu {...props} />
    </div>
  );
}

// UserAppShell.tsx에서 실제로 넘기는 형태 그대로 - 로그인 상태(닉네임/로그아웃/회원탈퇴).
export function LoggedIn() {
  return (
    <MemoryRouter>
      <OpenedUserMenu
        me={{ nickname: "기브미", profileImageUrl: null }}
        onLogout={() => {}}
        onWithdraw={() => {}}
      />
    </MemoryRouter>
  );
}

// 프로필 사진이 있는 경우 - Avatar가 이미지로 렌더링됨. 캡처 환경에 외부
// 네트워크 이미지가 안 뜨는 경우가 있어서(CampaignCard 미리보기도 같은 이유로
// 외부 URL을 안 씀), data URI로 안전하게 대체함.
const SAMPLE_PROFILE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%231a8ecb'/%3E%3Ccircle cx='24' cy='18' r='9' fill='%23ffffff'/%3E%3Cellipse cx='24' cy='42' rx='16' ry='12' fill='%23ffffff'/%3E%3C/svg%3E";

export function LoggedInWithPhoto() {
  return (
    <MemoryRouter>
      <OpenedUserMenu
        me={{
          nickname: "give_me_ticket",
          profileImageUrl: SAMPLE_PROFILE_IMAGE,
        }}
        onLogout={() => {}}
        onWithdraw={() => {}}
      />
    </MemoryRouter>
  );
}

// 비로그인(me=null) - 로그인 버튼 하나만 보임.
export function LoggedOut() {
  return (
    <MemoryRouter>
      <OpenedUserMenu me={null} onLogout={() => {}} onWithdraw={() => {}} />
    </MemoryRouter>
  );
}
