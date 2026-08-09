import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { RootRoute } from "./RootRoute";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "@/features/dashboard/pages/DashboardLayout";
import { MyTicketsTab } from "@/features/dashboard/components/MyTicketsTab";
import { MyCampaignsTab } from "@/features/dashboard/components/MyCampaignsTab";
import { CampaignCreatePage } from "@/features/campaign/pages/CampaignCreatePage";
import { CampaignDetailPage } from "@/features/campaign/pages/CampaignDetailPage";
import { CheckoutPage } from "@/features/application/pages/CheckoutPage";

const router = createBrowserRouter([
  // 비로그인도 접근 가능한 라우트
  { path: "/", element: <RootRoute /> },
  { path: "/campaigns/:shortCode", element: <CampaignDetailPage /> },

  // 로그인 필요한 라우트
  {
    element: <ProtectedRoute />,
    children: [
      {
        // path 없는 레이아웃 라우트: URL에 세그먼트를 추가하지 않고
        // /mytickets, /mycampaigns 두 라우트에 탭 UI만 공유시킴
        element: <DashboardLayout />,
        children: [
          { path: "/mytickets", element: <MyTicketsTab /> },
          { path: "/mycampaigns", element: <MyCampaignsTab /> },
        ],
      },
      { path: "/campaigns/create", element: <CampaignCreatePage /> },
      { path: "/checkout/:applicationId", element: <CheckoutPage /> },
    ],
  },

  { path: "*", element: <div className="p-8">페이지를 찾을 수 없어요</div> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
