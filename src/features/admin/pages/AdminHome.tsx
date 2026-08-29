// 도메인 연결 테스트용 임시 화면. 실제 어드민 기능(DB 접근 관리 API, 문의 응답 등)은
// 아직 구현 전 — admin.givemeticket.site가 제대로 이 앱으로 라우팅되는지만 확인하는 용도.
export function AdminHome() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) text-(--paper)">
      <p className="text-2xl font-bold">관리자화면</p>
    </div>
  );
}
