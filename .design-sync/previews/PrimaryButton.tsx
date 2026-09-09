import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";

// 실제 앱에서 가장 많이 쓰이는 문구("신청하기")를 그대로 사용. 노란 배경의
// 메인 액션 버튼 - 콘텐츠 크기만큼만 차지함(fullWidth 옵션 없음).
export function Default() {
  return <PrimaryButton onClick={() => {}}>신청하기</PrimaryButton>;
}

// urgent=true - 마감/오픈이 임박했을 때(CountdownApplyButton 등에서) 경고색
// 배경 + 펄스 애니메이션으로 전환됨.
export function Urgent() {
  return (
    <PrimaryButton urgent onClick={() => {}}>
      3, 2, 1...
    </PrimaryButton>
  );
}

// 처리 중 / 비활성 상태 - ApplySection이 신청 처리 중일 때 실제로 쓰는 문구.
export function Disabled() {
  return (
    <PrimaryButton disabled onClick={() => {}}>
      처리 중...
    </PrimaryButton>
  );
}
