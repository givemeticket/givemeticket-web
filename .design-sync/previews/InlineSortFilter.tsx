import { useState } from "react";
import { InlineSortFilter } from "@/features/dashboard/components/InlineSortFilter";

// 완전히 controlled 컴포넌트라 로컬 state로 감싸서 실제로 클릭해볼 수 있게 함.
// MyTicketsTab.tsx가 실제로 넘기는 정렬 옵션 그대로 사용.
const TICKETS_SORT_OPTIONS = [
  { value: "appliedAt", label: "신청 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

// MyCampaignsTab.tsx가 실제로 넘기는 정렬 옵션.
const CAMPAIGNS_SORT_OPTIONS = [
  { value: "createdAt", label: "만든 날짜" },
  { value: "openAt", label: "오픈 날짜" },
];

function Wrapper({
  sortOptions,
  initialSortBy,
}: {
  sortOptions: { value: string; label: string }[];
  initialSortBy: string;
}) {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  return (
    <InlineSortFilter
      sortOptions={sortOptions}
      sortValue={sortBy}
      onSortChange={setSortBy}
      sortDirection={sortDirection}
      onSortDirectionChange={setSortDirection}
      showExpiredOnly={showExpiredOnly}
      onShowExpiredOnlyChange={setShowExpiredOnly}
    />
  );
}

// "나의 티켓" 탭 기본 상태 - "신청 날짜" 선택, 내림차순(기본값).
export function TicketsDefault() {
  return (
    <Wrapper sortOptions={TICKETS_SORT_OPTIONS} initialSortBy="appliedAt" />
  );
}

// "나의 행사" 탭 - 다른 정렬 옵션 라벨 조합("만든 날짜"/"오픈 날짜").
export function CampaignsDefault() {
  return (
    <Wrapper sortOptions={CAMPAIGNS_SORT_OPTIONS} initialSortBy="createdAt" />
  );
}

// 오름차순으로 전환된 상태 - 화살표 아이콘이 위로 바뀜.
export function AscendingSort() {
  const [sortBy, setSortBy] = useState("openAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  return (
    <InlineSortFilter
      sortOptions={TICKETS_SORT_OPTIONS}
      sortValue={sortBy}
      onSortChange={setSortBy}
      sortDirection={sortDirection}
      onSortDirectionChange={setSortDirection}
      showExpiredOnly={showExpiredOnly}
      onShowExpiredOnlyChange={setShowExpiredOnly}
    />
  );
}

// "만료" 필터가 켜진 상태 - 만료 버튼이 정렬 버튼과 같은 활성 스타일(파란 배경)로 바뀜.
export function ExpiredOnlyActive() {
  const [sortBy, setSortBy] = useState("appliedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showExpiredOnly, setShowExpiredOnly] = useState(true);
  return (
    <InlineSortFilter
      sortOptions={TICKETS_SORT_OPTIONS}
      sortValue={sortBy}
      onSortChange={setSortBy}
      sortDirection={sortDirection}
      onSortDirectionChange={setSortDirection}
      showExpiredOnly={showExpiredOnly}
      onShowExpiredOnlyChange={setShowExpiredOnly}
    />
  );
}
