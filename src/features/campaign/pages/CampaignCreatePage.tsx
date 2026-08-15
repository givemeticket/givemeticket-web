import { useState, type ReactNode, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createCampaign } from "../api/campaignApi";
import { DateTimePickerField } from "@/shared/components/DateTimePickerField";
import { BackButton } from "@/shared/components/BackButton";

type PaymentOption = "required" | "not-required";

export function CampaignCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [totalStock, setTotalStock] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [payment, setPayment] = useState<PaymentOption>("not-required");
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
        requiresPayment: payment === "required",
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
    <div className="min-h-screen bg-(--ink) px-6 py-10 text-(--paper)">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-1">
          <BackButton fallback="/mycampaigns" />
          <h1 className="text-lg font-bold">행사 만들기</h1>
        </div>

        <p className="mt-1 text-sm text-(--muted)">
          기본 정보만 입력하면 바로 공유 링크가 만들어져요
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
          <Field label="행사 이름">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 여름 정기 세미나"
              maxLength={100}
              className="input"
            />
          </Field>

          <Field label="정원">
            <input
              type="number"
              min={1}
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              placeholder="예: 50"
              className="input"
            />
          </Field>

          <DateTimePickerField
            label="신청 오픈 시각"
            value={openAt}
            onChange={setOpenAt}
          />

          <Field label="결제 필요 여부">
            <div className="flex gap-2">
              <PaymentToggleButton
                label="결제 없음"
                active={payment === "not-required"}
                onClick={() => setPayment("not-required")}
              />
              <PaymentToggleButton
                label="결제 필요"
                active={payment === "required"}
                onClick={() => setPayment("required")}
              />
            </div>
          </Field>

          {errorMessage && (
            <p className="text-xs text-(--warn)">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="mt-2 rounded-full px-4 py-3 text-sm font-semibold text-(--on-yellow) transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40"
            style={{ backgroundColor: "var(--brand-yellow)" }}
          >
            {isSubmitting ? "만드는 중..." : "행사 만들기"}
          </button>
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

function PaymentToggleButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors"
      style={
        active
          ? {
              backgroundColor: "var(--brand-blue)",
              borderColor: "var(--brand-blue)",
              color: "var(--on-brand)",
            }
          : { borderColor: "var(--line)", color: "var(--muted)" }
      }
    >
      {label}
    </button>
  );
}
