import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MotionGlobalConfig } from "motion/react";
import { MyTicketsTab } from "@/features/dashboard/components/MyTicketsTab";
import type { CampaignItem } from "@/features/campaign/api/campaignApi";

// CampaignListTab.tsx 미리보기와 같은 이유(FadeSlide 마운트 페이드인이 정적
// 스크린샷에서 빈 화면으로 캡처됨)로 애니메이션을 전역으로 건너뜀.
MotionGlobalConfig.skipAnimations = true;

// MyTicketsTab은 CampaignListTab(scope="participated")에 고정 props만 채워
// 넘기는 얇은 wrapper라, CampaignListTab.tsx 미리보기와 같은 이유로
// QueryClientProvider(캐시에 미리 데이터 채움) + MemoryRouter가 필요함.
function withCachedTickets(items: CampaignItem[]) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
    },
  });
  qc.setQueryData(["campaigns", "participated"], items);
  return qc;
}

// CampaignListTab.tsx 미리보기와 같은 실제 문구/데이터 재사용.
const TICKET_ITEMS: CampaignItem[] = [
  {
    id: 1,
    owner: { id: 10, nickname: "givemeticket_official" },
    shortCode: "nyfm26",
    title: "2026 신년 팬미팅 - 선착순 입장",
    totalStock: 200,
    remainingStock: 12,
    soldOut: false,
    openAt: "2026-01-20T11:00:00Z",
    status: "OPEN",
    myApplicationStatus: "CONFIRMED",
  },
  {
    id: 2,
    owner: { id: 11, nickname: "merch_team" },
    shortCode: "merch01",
    title: "한정판 굿즈 사전예약",
    totalStock: 50,
    remainingStock: 0,
    soldOut: true,
    openAt: "2026-01-15T03:00:00Z",
    status: "OPEN",
    myApplicationStatus: "CONFIRMED",
  },
];

// 신청한 티켓이 있는 기본 상태.
export function WithResults() {
  return (
    <QueryClientProvider client={withCachedTickets(TICKET_ITEMS)}>
      <MemoryRouter>
        <MyTicketsTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// 아직 신청한 행사가 없는 상태 - EmptyState, "나의 티켓" 탭 고유 문구/아이콘(Ticket).
export function Empty() {
  return (
    <QueryClientProvider client={withCachedTickets([])}>
      <MemoryRouter>
        <MyTicketsTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
