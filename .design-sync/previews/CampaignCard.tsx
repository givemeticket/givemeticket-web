import { CampaignCard } from "@/features/campaign/components/CampaignCard";

// 상태(status)가 이 카드의 핵심 변주 축 - 뱃지 색과 문구가 상태별로 완전히
// 달라짐. 진행중 + 잔여 재고가 있는 가장 흔한 경우.
export function Open() {
  return (
    <CampaignCard
      title="2026 신년 팬미팅 - 선착순 입장"
      status="OPEN"
      openAtLabel="1월 20일 20:00 오픈"
      remainingStock={12}
      totalStock={200}
      ownerNickname="givemeticket_official"
      onClick={() => {}}
    />
  );
}

// 진행중이지만 매진 - 상태는 여전히 OPEN이고 뱃지만 "매진"으로 덮어써짐
// (실제 백엔드 스펙에 FULL 상태가 따로 없음, CampaignCard.tsx 주석 참고).
export function SoldOut() {
  return (
    <CampaignCard
      title="한정판 굿즈 사전예약"
      status="OPEN"
      soldOut
      openAtLabel="1월 15일 12:00 오픈"
      remainingStock={0}
      totalStock={50}
      ownerNickname="merch_team"
      onClick={() => {}}
    />
  );
}

// 오픈 예정 - 아직 재고 수치가 없어 스텁(잔여 좌석 표시) 없이 렌더링됨.
export function Scheduled() {
  return (
    <CampaignCard
      title="봄맞이 워크숍 참가 신청"
      status="SCHEDULED"
      openAtLabel="3월 2일 10:00 오픈 예정"
      ownerNickname="workshop_lab"
      onClick={() => {}}
    />
  );
}

// 종료됨 - 회색조로 톤 다운.
export function Closed() {
  return (
    <CampaignCard
      title="연말 팬사인회"
      status="CLOSED"
      openAtLabel="12월 24일 19:00 오픈"
      remainingStock={0}
      totalStock={100}
      ownerNickname="fanmeeting_crew"
      onClick={() => {}}
    />
  );
}

// 삭제됨 - 클릭 비활성화, 별도 배경색. 목록에서 실제로 노출되는 엣지 케이스.
export function Deleted() {
  return (
    <CampaignCard
      title="취소된 행사"
      status="DELETED"
      openAtLabel="1월 5일 18:00 오픈"
      ownerNickname="host_account"
      onClick={() => {}}
    />
  );
}
