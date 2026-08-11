import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/shared/components/EmptyState";

// TODO: 내가 생성한 캠페인 목록 API 연동, 카드 클릭 시 /campaigns/:shortCode (관리자 뷰)로 이동
export function MyCampaignsTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/campaigns/create")}
          className="rounded-full px-4 py-2 text-sm font-semibold text-(--ink) transition-transform hover:scale-[1.03] active:scale-[0.97]"
          style={{ backgroundColor: "var(--brand-yellow)" }}
        >
          + 행사 만들기
        </button>
      </div>

      <EmptyState
        icon={<PlusIcon />}
        title="아직 만든 행사가 없어요"
        description="첫 행사를 열어서 선착순 신청을 받아보세요"
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
