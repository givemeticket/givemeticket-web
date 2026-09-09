import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/shared/components/buttons/SecondaryButton";
import { FixedWidthLabel } from "@/shared/components/buttons/FixedWidthLabel";

// ApplySection의 "신청하기" 버튼 - minWidthText("00:00:00")가 실제로 보이는
// 텍스트보다 넓어서, 화면엔 안 보이는 그 기준 텍스트만큼 버튼 너비가 고정됨.
export function Default() {
  return (
    <PrimaryButton onClick={() => {}}>
      <FixedWidthLabel text="신청하기" minWidthText="00:00:00" />
    </PrimaryButton>
  );
}

// CountdownApplyButton이 실제로 매 초 바꿔 그리는 카운트다운 숫자 - 이렇게
// 자릿수가 그대로인 텍스트가 들어와도 물론 버튼 너비는 흔들리지 않음.
export function Countdown() {
  return (
    <PrimaryButton onClick={() => {}} urgent>
      <FixedWidthLabel text="00:00:47" minWidthText="00:00:00" />
    </PrimaryButton>
  );
}

// CampaignDetailPage의 "신청 취소" 버튼 - 위 두 개보다 훨씬 짧은 텍스트지만,
// 같은 minWidthText를 공유하기 때문에 버튼 너비가 Default/Countdown과 정확히
// 똑같이 유지됨(이 컴포넌트가 존재하는 이유 그 자체).
export function ShorterText() {
  return (
    <SecondaryButton onClick={() => {}}>
      <FixedWidthLabel text="신청 취소" minWidthText="00:00:00" />
    </SecondaryButton>
  );
}
