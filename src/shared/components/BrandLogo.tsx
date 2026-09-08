import { useNavigate } from "react-router-dom";

// 로고 아이콘 + "GIVEMETICKET" 텍스트를 묶은 버튼. 누르면 홈으로 이동함 — "/"는
// RootRoute가 로그인 여부에 따라 알아서 대시보드 또는 로그인 화면으로 보내주니,
// 로그인 상태와 무관하게 항상 이 경로로 이동하면 됨.
//
// 텍스트를 "GIVEME"/"TICKET" 두 줄로 쌓아서 가로 폭을 줄임 — 헤더에 탭(나의
// 티켓/나의 행사)까지 같은 줄에 들어가게 되면서, 한 줄로 쓰던 letter-spacing
// 있는 "GIVEMETICKET" 텍스트의 가로 폭(아이콘 포함 약 140~160px)이 좁은
// 화면에서 다른 요소들과 자리다툼을 했음. 두 줄로 쌓으면 긴 쪽 단어(6자)
// 기준으로 줄어서 여유가 생김.
export function BrandLogo() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="flex items-center gap-2"
    >
      <img src="/favicon-transparent-512.png" alt="" className="h-7 w-7" />
      <span className="flex flex-col text-xs leading-tight font-semibold tracking-[0.25em] text-(--muted)">
        <span>GIVEME</span>
        <span>TICKET</span>
      </span>
    </button>
  );
}
