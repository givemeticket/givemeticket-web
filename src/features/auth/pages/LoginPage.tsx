// TODO: 서비스 기능 소개 섹션 + 카카오/네이버 로그인 버튼 UI 구현 예정
// TODO: 로그인 성공 시 쿼리파라미터 redirect 값을 읽어 해당 경로로 이동시키는 로직 필요
//   예: const [params] = useSearchParams(); const redirect = params.get("redirect") ?? "/mytickets";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">GiveMeTicket</h1>
        <p className="mt-2 text-gray-500">로그인 페이지 (구현 예정)</p>
      </div>
    </div>
  );
}
