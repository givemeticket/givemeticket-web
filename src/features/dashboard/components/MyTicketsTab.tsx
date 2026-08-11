import { EmptyState } from "@/shared/components/EmptyState";

// TODO: 내가 신청한 캠페인 목록 조회 API 연동, 카드 클릭 시 /campaigns/:shortCode 로 이동
export function MyTicketsTab() {
  return (
    <EmptyState
      icon={<TicketIcon />}
      title="아직 신청한 행사가 없어요"
      description="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
    />
  );
}

function TicketIcon() {
  return (
    <svg
      width="24"
      height="20"
      viewBox="0 0 32 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4v-4a2 2 0 1 0 0-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line
        x1="16"
        y1="5"
        x2="16"
        y2="19"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="2 2.4"
      />
    </svg>
  );
}
