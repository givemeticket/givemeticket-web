import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AdminHome } from "@/features/admin/pages/AdminHome";

// 어드민 도메인 전용 앱. 이 파일 자체가 main.tsx에서 동적 import될 때만 로드되니까,
// 여기서 AdminHome을 정적으로 import해도 일반 사용자 번들엔 전혀 영향 없음
// (일반 사용자는 이 파일 자체를 아예 안 받아옴).
const adminRouter = createBrowserRouter([
  { path: "*", element: <AdminHome /> },
]);

export function AdminApp() {
  return <RouterProvider router={adminRouter} />;
}
