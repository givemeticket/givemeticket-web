import { useState, type ReactNode, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign } from "../api/campaignApi";
import { DateTimePickerField } from "@/shared/components/DateTimePickerField";
import { nowAsDatetimeLocalValue } from "@/shared/lib/formatDate";
import { BackButton } from "@/shared/components/BackButton";
import { PrimaryButton } from "@/shared/components/PrimaryButton";

export function CampaignCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [totalStock, setTotalStock] = useState("1");
  const [openAt, setOpenAt] = useState(() => nowAsDatetimeLocalValue());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isFormValid =
    title.trim().length > 0 &&
    openAt.length > 0 &&
    totalStock.trim().length > 0 &&
    Number(totalStock) > 0;

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    const openAtDate = new Date(openAt);
    if (openAtDate.getTime() <= Date.now()) {
      setErrorMessage("오픈 시각은 지금보다 미래여야 해요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await createCampaign({
        title: title.trim(),
        totalStock: Number(totalStock),
        openAt: openAtDate.toISOString(),
      });
      // 생성 즉시 상세 화면(관리자 뷰)으로 이동 — 공유 링크 복사는 그 화면에 있음
      navigate(`/campaigns/${result.shortCode}`, {
        replace: true,
        state: { from: "mycampaigns" },
      });
    } catch {
      setErrorMessage("행사를 만드는 중 문제가 발생했어요. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--ink) py-10 text-(--paper)">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex items-center gap-1">
          <BackButton fallback="/mycampaigns" />
          <h1 className="text-lg font-bold">행사 추가</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-6 rounded-2xl border p-6"
          style={{ borderColor: "var(--line)" }}
        >
          <Field label="행사 이름">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="GIVEMETICKET 캠페인"
              maxLength={100}
              className="input"
            />
          </Field>

          <div className="flex gap-4">
            <div className="flex-1">
              <Field label="정원">
                <input
                  type="number"
                  min={1}
                  value={totalStock}
                  onChange={(e) => setTotalStock(e.target.value)}
                  className="input"
                />
              </Field>
            </div>

            <div className="flex-1">
              <DateTimePickerField
                label="신청 오픈 시각"
                value={openAt}
                onChange={setOpenAt}
              />
            </div>
          </div>

          {errorMessage && (
            <p className="text-xs text-(--warn)">{errorMessage}</p>
          )}

          <div className="self-end">
            <PrimaryButton
              type="submit"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "저장"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-(--paper)">{label}</span>
      {children}
      {hint && <span className="text-xs text-(--muted)">{hint}</span>}
    </label>
  );
}
