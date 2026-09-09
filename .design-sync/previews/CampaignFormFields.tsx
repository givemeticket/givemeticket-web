import { useState, type ReactNode } from "react";
import { CampaignFormFields } from "@/features/campaign/components/CampaignFormFields";
import { nowAsDatetimeLocalValue } from "@/shared/lib/formatDate";

// 실제 사용 페이지들(CampaignCreatePage/CampaignEditPage)과 동일하게, 폼을
// 감싸는 카드 레이아웃(rounded-2xl border p-6)까지 같이 재현함 - 필드
// 자체는 배경이 없어서 이 껍데기가 있어야 실제 화면과 같은 맥락으로 보임.
function FormShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border p-6"
      style={{ borderColor: "var(--line)" }}
    >
      {children}
    </div>
  );
}

// 행사 추가(CampaignCreatePage) - 빈 폼, 제목 placeholder만 보임, 제약조건 없음.
export function Create() {
  const [title, setTitle] = useState("");
  const [totalStock, setTotalStock] = useState("1");
  const [openAt, setOpenAt] = useState(() => nowAsDatetimeLocalValue());
  return (
    <FormShell>
      <CampaignFormFields
        title={title}
        onTitleChange={setTitle}
        totalStock={totalStock}
        onTotalStockChange={setTotalStock}
        openAt={openAt}
        onOpenAtChange={setOpenAt}
      />
    </FormShell>
  );
}

// 값이 이미 채워진 상태 - 실제로 입력을 마친 직후의 모습.
export function Filled() {
  const [title, setTitle] = useState("2026 신년 팬미팅 - 선착순 입장");
  const [totalStock, setTotalStock] = useState("200");
  const [openAt, setOpenAt] = useState("2026-01-20T20:00");
  return (
    <FormShell>
      <CampaignFormFields
        title={title}
        onTitleChange={setTitle}
        totalStock={totalStock}
        onTotalStockChange={setTotalStock}
        openAt={openAt}
        onOpenAtChange={setOpenAt}
      />
    </FormShell>
  );
}

// 행사 수정(CampaignEditPage), 이미 오픈된(OPEN) 캠페인 - 정원은 줄일 수
// 없고(totalStockMin=현재 정원 + 안내 아이콘), 오픈시각도 원래 시각보다
// 못 당김(openAtMinDate + resetToNowOnOpen + originalValue로 되돌리기
// 버튼까지 노출) - CampaignEditPage.tsx의 실제 분기 그대로.
export function EditingOpenCampaign() {
  const originalOpenAt = "2026-01-20T20:00";
  const [title, setTitle] = useState("2026 신년 팬미팅 - 선착순 입장");
  const [totalStock, setTotalStock] = useState("200");
  const [openAt, setOpenAt] = useState(() => nowAsDatetimeLocalValue());
  return (
    <FormShell>
      <CampaignFormFields
        title={title}
        onTitleChange={setTitle}
        totalStock={totalStock}
        onTotalStockChange={setTotalStock}
        totalStockMin={200}
        totalStockInfo="정원 유지 또는 증원만 가능합니다."
        openAt={openAt}
        onOpenAtChange={setOpenAt}
        openAtMinDate={new Date(originalOpenAt)}
        openAtResetToNowOnOpen
        openAtOriginalValue={originalOpenAt}
        openAtInfo="오픈 시각 유지 또는 미래만 가능합니다."
      />
    </FormShell>
  );
}
