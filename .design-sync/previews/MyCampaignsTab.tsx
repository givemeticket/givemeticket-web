import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MotionGlobalConfig } from "motion/react";
import { MyCampaignsTab } from "@/features/dashboard/components/MyCampaignsTab";
import type { CampaignItem } from "@/features/campaign/api/campaignApi";

// CampaignListTab.tsx 미리보기와 같은 이유(FadeSlide 마운트 페이드인이 정적
// 스크린샷에서 빈 화면으로 캡처됨)로 애니메이션을 전역으로 건너뜀.
MotionGlobalConfig.skipAnimations = true;

// MyCampaignsTab은 CampaignListTab(scope="owned")에 고정 props만 채워 넘기는
// 얇은 wrapper라, CampaignListTab.tsx 미리보기와 같은 이유로
// QueryClientProvider(캐시에 미리 데이터 채움) + MemoryRouter가 필요함.
function withCachedCampaigns(items: CampaignItem[]) {
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
  qc.setQueryData(["campaigns", "owned"], items);
  return qc;
}

// CampaignListTab.tsx 미리보기와 같은 실제 문구/데이터 재사용. DELETED 항목은
// 기본 필터(showExpiredOnly=false)에서 걸러져 화면엔 안 보이지만, 실제 목록
// API가 삭제된 행사도 같이 내려준다는 걸 데이터로 반영해둠.
const OWNED_ITEMS: CampaignItem[] = [
  {
    id: 1,
    owner: { id: 99, nickname: "givemeticket_official" },
    shortCode: "nyfm26",
    title: "2026 신년 팬미팅 - 선착순 입장",
    totalStock: 200,
    remainingStock: 12,
    soldOut: false,
    openAt: "2026-01-20T11:00:00Z",
    status: "OPEN",
  },
  {
    id: 3,
    owner: { id: 99, nickname: "workshop_lab" },
    shortCode: "springwk",
    title: "봄맞이 워크숍 참가 신청",
    totalStock: null,
    remainingStock: null,
    soldOut: null,
    openAt: "2026-03-02T01:00:00Z",
    status: "SCHEDULED",
  },
  {
    id: 4,
    owner: { id: 99, nickname: "host_account" },
    shortCode: "cancelled1",
    title: "취소된 행사",
    totalStock: null,
    remainingStock: null,
    soldOut: null,
    openAt: "2026-01-05T09:00:00Z",
    status: "DELETED",
  },
];

// 만든 행사가 있는 기본 상태 - owned scope라 오른쪽에 "행사 추가" 버튼도 같이 뜸.
export function WithResults() {
  return (
    <QueryClientProvider client={withCachedCampaigns(OWNED_ITEMS)}>
      <MemoryRouter>
        <MyCampaignsTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// 아직 만든 행사가 없는 상태 - EmptyState, "나의 행사" 탭 고유 문구/아이콘(CalendarPlus).
// "행사 추가" 버튼은 목록이 비어도 계속 떠 있음(첫 행사를 만들 수 있어야 하니까).
export function Empty() {
  return (
    <QueryClientProvider client={withCachedCampaigns([])}>
      <MemoryRouter>
        <MyCampaignsTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
