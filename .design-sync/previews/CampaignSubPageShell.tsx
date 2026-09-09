import { useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { MotionGlobalConfig } from "motion/react";
import { ArrowUpDown, Search, X } from "lucide-react";
import { CampaignSubPageShell } from "@/features/campaign/components/CampaignSubPageShell";
import { CampaignFormFields } from "@/features/campaign/components/CampaignFormFields";

// CampaignSubPageShell은 내부적으로 AnimatedPageBackground → FadeSlide를 써서
// 마운트 시 opacity:0에서 시작해 페이드인한다(motion/react). 정적 스크린샷은
// 애니메이션이 끝나길 기다려주지 않아서, 캡처 시점에 우연히 opacity:0 상태를
// 찍어버려 카드가 완전히 빈 화면으로 나오는 문제가 있었다. motion 라이브러리가
// 공식 제공하는 전역 스위치(MotionGlobalConfig.skipAnimations)로 모든 애니메이션을
// 즉시 최종 상태로 건너뛰게 해서 해결함 — 컴포넌트 자체는 전혀 안 건드림.
MotionGlobalConfig.skipAnimations = true;
import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";
import { IconButton } from "@/shared/components/buttons/IconButton";
import { Avatar } from "@/shared/components/Avatar";

// BackButton(내부에서 useNavigate 사용)이 있어서 MemoryRouter로 감싸야 함.

// CampaignCreatePage.tsx와 동일한 실제 폼 구조("행사 추가"). CampaignFormFields는
// 완전히 controlled라 로컬 state로 채워서 진짜처럼 입력 가능하게 함.
function CreateCampaignForm() {
  const [title, setTitle] = useState("");
  const [totalStock, setTotalStock] = useState("1");
  const [openAt, setOpenAt] = useState("2026-09-20T20:00");
  return (
    <form
      className="mt-8 flex flex-col gap-6 rounded-2xl border p-6"
      style={{ borderColor: "var(--line)" }}
      onSubmit={(e) => e.preventDefault()}
    >
      <CampaignFormFields
        title={title}
        onTitleChange={setTitle}
        totalStock={totalStock}
        onTotalStockChange={setTotalStock}
        openAt={openAt}
        onOpenAtChange={setOpenAt}
      />
      <div className="self-end">
        <PrimaryButton type="submit">추가</PrimaryButton>
      </div>
    </form>
  );
}

export function CreateCampaign() {
  return (
    <MemoryRouter>
      <CampaignSubPageShell title="행사 추가" backButtonFallback="/mycampaigns">
        <CreateCampaignForm />
      </CampaignSubPageShell>
    </MemoryRouter>
  );
}

// CampaignEditPage.tsx와 동일 - 이미 있는 행사값이 채워진 수정 폼. 오픈된
// 캠페인이라 정원/오픈시각 옆에 안내 아이콘(totalStockInfo/openAtInfo)이 붙는
// 실제 케이스를 보여줌.
function EditCampaignForm() {
  const [title, setTitle] = useState("2026 신년 팬미팅 - 선착순 입장");
  const [totalStock, setTotalStock] = useState("200");
  const [openAt, setOpenAt] = useState("2026-01-20T20:00");
  return (
    <form
      className="mt-8 flex flex-col gap-6 rounded-2xl border p-6"
      style={{ borderColor: "var(--line)" }}
      onSubmit={(e) => e.preventDefault()}
    >
      <CampaignFormFields
        title={title}
        onTitleChange={setTitle}
        totalStock={totalStock}
        onTotalStockChange={setTotalStock}
        totalStockMin={200}
        totalStockInfo="정원 유지 또는 증원만 가능합니다."
        openAt={openAt}
        onOpenAtChange={setOpenAt}
        openAtInfo="오픈 시각 유지 또는 미래만 가능합니다."
      />
      <div className="self-end">
        <PrimaryButton type="submit">저장</PrimaryButton>
      </div>
    </form>
  );
}

export function EditCampaign() {
  return (
    <MemoryRouter>
      <CampaignSubPageShell
        title="행사 수정"
        backButtonFallback="/campaigns/abc123"
        backButtonForceFallback
      >
        <EditCampaignForm />
      </CampaignSubPageShell>
    </MemoryRouter>
  );
}

// CampaignApplicantsPage.tsx와 동일한 실제 문구 - 검색/정렬 바 + 신청자 목록.
// title/children 조합이 폼과는 확연히 다른 모양이라, 이 셸이 "제목+뒤로가기
// 헤더"만 강제하고 본문은 완전히 자유롭다는 걸 보여주는 세 번째 케이스.
function ApplicantsListContent() {
  const applicants = [
    { rank: 1, nickname: "give_me_ticket", appliedAt: "1월 20일 20:00" },
    { rank: 2, nickname: "ticket_hunter_02", appliedAt: "1월 20일 20:00" },
    { rank: 3, nickname: "fan_account_kr", appliedAt: "1월 20일 20:01" },
  ];
  return (
    <>
      <p className="mt-1 text-sm text-(--muted)">
        2026 신년 팬미팅 - 선착순 입장 · 총 {applicants.length}명
      </p>

      <div className="mt-4 flex items-center gap-2">
        <IconButton
          size="sm"
          onClick={() => {}}
          label="정렬 순서 변경"
          align="left"
        >
          <ArrowUpDown size={16} strokeWidth={2} />
        </IconButton>
        <div className="relative w-48">
          <Search
            size={15}
            strokeWidth={2}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--muted)"
          />
          <input
            type="text"
            placeholder="닉네임으로 검색"
            className="input w-full"
            style={{
              paddingLeft: "2.25rem",
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
            }}
            readOnly
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {applicants.map((a) => (
          <div
            key={a.rank}
            className="flex items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: "var(--line)" }}
          >
            <span className="w-6 shrink-0 text-center text-xs text-(--muted)">
              {a.rank}
            </span>
            <Avatar name={a.nickname} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.nickname}</p>
              <p className="text-xs text-(--muted)">{a.appliedAt} 신청</p>
            </div>
            <IconButton onClick={() => {}} label="신청 취소" tone="warn">
              <X size={16} strokeWidth={2} />
            </IconButton>
          </div>
        ))}
      </div>
    </>
  );
}

export function ApplicantsList() {
  return (
    <MemoryRouter>
      <CampaignSubPageShell
        title="신청자 목록"
        backButtonFallback="/campaigns/abc123"
        backButtonForceFallback
      >
        <ApplicantsListContent />
      </CampaignSubPageShell>
    </MemoryRouter>
  );
}
