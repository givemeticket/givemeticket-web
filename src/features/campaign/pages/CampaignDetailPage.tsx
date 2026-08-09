import { useParams } from "react-router-dom";

// TODO: shortCode로 캠페인 조회 API 호출, 응답의 role(GUEST/VIEWER/PARTICIPANT/OWNER)에 따라
// 4가지 화면(비로그인/비참여자/참여자/관리자)을 분기 렌더링.
// "신청하기" 버튼 클릭 시 비로그인이면 여기서 직접 /?redirect=... 로 이동시켜야 함
// (라우트 자체는 ProtectedRoute 밖에 있어 조회는 항상 허용되기 때문).
export function CampaignDetailPage() {
  const { shortCode } = useParams();

  return <div>캠페인 상세 - {shortCode} (구현 예정)</div>;
}
