import { CountdownApplyButton } from "@/features/campaign/components/CountdownApplyButton";

// 서버 시각 오차 보정을 위해 내부적으로 getServerTimeOffset()을 호출하는데,
// 이 API는 미리보기 환경에 백엔드가 없어 실패함 - 컴포넌트가 이미 그
// 실패를 catch해서 로컬 시계(오차 0)로 계속 진행하도록 만들어져 있어서
// 정상적으로 렌더링됨(초기 표시값은 오차 반영 전 기준이라 오차 보정
// 여부와 무관하게 동일).

// 오픈까지 넉넉히 남은 경우 - "일" 단위로 표시되어 초 단위로 계속
// 바뀌지 않는 안정적인 값(3일).
export function Countdown() {
  const openAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
  return (
    <CountdownApplyButton
      openAt={openAt}
      isActing={false}
      onClick={() => {}}
      onExpire={() => {}}
    />
  );
}

// 오픈 60초 이내 - urgent 스타일(경고색 배경 + 펄스 애니메이션)로 전환되는
// 임박 상태.
export function Urgent() {
  const openAt = new Date(Date.now() + 45_000).toISOString();
  return (
    <CountdownApplyButton
      openAt={openAt}
      isActing={false}
      onClick={() => {}}
      onExpire={() => {}}
    />
  );
}

// 신청 처리 중 - 실제 신청 API 응답을 기다리는 동안 "처리 중..."으로 바뀌고
// 버튼이 비활성화됨.
export function Processing() {
  const openAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
  return (
    <CountdownApplyButton
      openAt={openAt}
      isActing
      onClick={() => {}}
      onExpire={() => {}}
    />
  );
}
