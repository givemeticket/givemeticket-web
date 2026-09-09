import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { MotionGlobalConfig } from "motion/react";
import { Ticket, CalendarPlus } from "lucide-react";
import { CampaignListTab } from "@/features/dashboard/components/CampaignListTab";
import type { CampaignItem } from "@/features/campaign/api/campaignApi";

// CampaignListTab은 내부에서 FadeSlide(motion/react)로 콘텐츠를 마운트 시
// opacity:0에서 페이드인시키는데, 정적 스크린샷은 애니메이션이 끝나길
// 기다려주지 않아 카드가 빈 화면으로 캡처되는 문제가 있었다. 라이브러리가
// 공식 제공하는 전역 스위치로 애니메이션을 즉시 최종 상태로 건너뛰게 해서
// 해결함 — 컴포넌트 자체는 안 건드림.
MotionGlobalConfig.skipAnimations = true;

// CampaignListTab은 내부에서 useQuery(["campaigns", scope])로 실제 백엔드를
// 호출하고, useNavigate도 쓴다. 미리보기 환경엔 QueryClientProvider도
// 백엔드도 없어서, 캐시에 미리 데이터를 채워넣은 격리된 QueryClient +
// MemoryRouter로 감싼다. retry/refetch를 꺼서 캐시 밖으로 실제 네트워크
// 요청이 새로 나가지 않게 함(어차피 실패할 요청이라 콘솔 에러만 남길 뿐임).
function withCachedCampaigns(scope: string, items: CampaignItem[]) {
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
  qc.setQueryData(["campaigns", scope], items);
  return qc;
}

// MyTicketsTab.tsx가 실제로 만드는 CampaignItem 모양 - CampaignCard 미리보기와
// 같은 실제 문구를 재사용해서 디자인 시스템 전체에서 같은 캠페인처럼 보이게 함.
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

// MyCampaignsTab.tsx가 실제로 만드는 CampaignItem 모양. DELETED 항목은
// showExpiredOnly가 꺼진 기본 상태에선 목록에서 걸러져서 화면엔 안 보임 -
// 실제 목록 API가 삭제된 행사도 같이 내려준다는 걸 데이터로만 반영해둠.
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

const TICKETS_SORT_OPTIONS = [
  { value: "appliedAt", label: "신청 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

const CAMPAIGNS_SORT_OPTIONS = [
  { value: "createdAt", label: "만든 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

// "나의 티켓" - 결과 있음. participated scope는 "행사 추가" 버튼이 없음.
export function TicketsWithResults() {
  return (
    <QueryClientProvider client={withCachedCampaigns("participated", TICKET_ITEMS)}>
      <MemoryRouter>
        <CampaignListTab
          scope="participated"
          pageTitle="나의 티켓"
          emptyIcon={<Ticket size={24} strokeWidth={1.6} />}
          emptyTitle="아직 신청한 행사가 없어요"
          emptyDescription="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
          fromKey="mytickets"
          sortOptions={TICKETS_SORT_OPTIONS}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// "나의 티켓" - 결과 없음(EmptyState). 대시보드 탭의 핵심 두 상태 중 하나.
export function TicketsEmpty() {
  return (
    <QueryClientProvider client={withCachedCampaigns("participated", [])}>
      <MemoryRouter>
        <CampaignListTab
          scope="participated"
          pageTitle="나의 티켓"
          emptyIcon={<Ticket size={24} strokeWidth={1.6} />}
          emptyTitle="아직 신청한 행사가 없어요"
          emptyDescription="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
          fromKey="mytickets"
          sortOptions={TICKETS_SORT_OPTIONS}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// "나의 행사" - 결과 있음. owned scope는 오른쪽에 "행사 추가" 버튼이 같이 뜸.
export function CampaignsWithResults() {
  return (
    <QueryClientProvider client={withCachedCampaigns("owned", OWNED_ITEMS)}>
      <MemoryRouter>
        <CampaignListTab
          scope="owned"
          pageTitle="나의 행사"
          emptyIcon={<CalendarPlus size={22} strokeWidth={1.7} />}
          emptyTitle="아직 만든 행사가 없어요"
          emptyDescription="첫 행사를 열어서 선착순 신청을 받아보세요"
          fromKey="mycampaigns"
          sortOptions={CAMPAIGNS_SORT_OPTIONS}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// "나의 행사" - 결과 없음(EmptyState). "행사 추가" 버튼은 목록이 비어도 계속 뜸.
export function CampaignsEmpty() {
  return (
    <QueryClientProvider client={withCachedCampaigns("owned", [])}>
      <MemoryRouter>
        <CampaignListTab
          scope="owned"
          pageTitle="나의 행사"
          emptyIcon={<CalendarPlus size={22} strokeWidth={1.7} />}
          emptyTitle="아직 만든 행사가 없어요"
          emptyDescription="첫 행사를 열어서 선착순 신청을 받아보세요"
          fromKey="mycampaigns"
          sortOptions={CAMPAIGNS_SORT_OPTIONS}
        />
      </MemoryRouter>
    </QueryClientProvider>
  );
}
