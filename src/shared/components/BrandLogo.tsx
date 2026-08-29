import { useNavigate } from "react-router-dom";

// 로고 아이콘 + "GIVEMETICKET" 텍스트를 묶은 버튼. 누르면 홈으로 이동함 — "/"는
// RootRoute가 로그인 여부에 따라 알아서 대시보드 또는 로그인 화면으로 보내주니,
// 로그인 상태와 무관하게 항상 이 경로로 이동하면 됨.
export function BrandLogo() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="flex items-center gap-2"
    >
      <img src="/favicon-transparent-512.png" alt="" className="h-7 w-7" />
      <span className="text-xs font-semibold tracking-[0.25em] text-(--muted)">
        GIVEMETICKET
      </span>
    </button>
  );
}
