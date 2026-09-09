import { SecondaryButton } from "@/shared/components/buttons/SecondaryButton";
import { FixedWidthLabel } from "@/shared/components/buttons/FixedWidthLabel";

// 가장 흔한 쓰임 - ConfirmDialog의 취소 버튼(cancelLabel 기본값 "취소"). 테두리만
// 있고 내용물 크기만큼만 차지하는 보조 액션 버튼의 기본형.
export function Default() {
  return <SecondaryButton onClick={() => {}}>취소</SecondaryButton>;
}

// CampaignDetailPage에서 신청 취소 버튼이 실제로 쓰는 조합 - FixedWidthLabel로
// 감싸서 카운트다운/신청하기 버튼과 너비를 맞춤(minWidthText="00:00:00").
export function CancelApplication() {
  return (
    <SecondaryButton onClick={() => {}}>
      <FixedWidthLabel text="신청 취소" minWidthText="00:00:00" />
    </SecondaryButton>
  );
}

// ApplySection - 행사가 CLOSED/DELETED 상태일 때 신청 버튼 자리를 대신하는
// 비활성 안내 문구. disabled=true라 opacity-40으로 흐려짐.
export function ClosedDisabled() {
  return <SecondaryButton disabled>종료된 행사예요</SecondaryButton>;
}

// FullPageMessage(404/삭제된 캠페인 등 막다른 화면)에서 유일한 탈출구로 쓰는
// "홈으로 돌아가기" 버튼.
export function HomeButton() {
  return <SecondaryButton onClick={() => {}}>홈으로 돌아가기</SecondaryButton>;
}
