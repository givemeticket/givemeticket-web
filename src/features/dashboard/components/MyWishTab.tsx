// "찜한 행사" 탭 placeholder. MyTicketsTab/MyCampaignsTab처럼 DashboardLayout
// 아래 라우트 중첩(`/mywish`)으로 쓰임 — HomeTab.tsx와 달리 별도 조립 없이
// 그냥 라우트 element로 등록됨(UserApp.tsx 참고).
export function MyWishTab() {
  return (
    <div className="flex h-full items-center justify-center text-(--paper)">
      <p className="text-2xl font-bold">찜한 행사</p>
    </div>
  );
}
