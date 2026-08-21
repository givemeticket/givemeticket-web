import { useState, type ReactNode } from "react";
import axios from "axios";
import { updateCampaign, type CampaignDetail } from "../api/campaignApi";
import { isoToDatetimeLocalValue } from "@/shared/lib/formatDate";
import { DateTimePickerField } from "@/shared/components/DateTimePickerField";

// 관리자(개설자) 전용 패널 — 공유 링크 복사, 오픈시각/정원 수정, 종료, 삭제.
export function OwnerPanel({
  campaign,
  isActing,
  setIsActing,
  setActionError,
  onDelete,
  onClose,
  onRefetch,
}: {
  campaign: CampaignDetail;
  isActing: boolean;
  setIsActing: (v: boolean) => void;
  setActionError: (v: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onRefetch: () => Promise<unknown>;
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newOpenAt, setNewOpenAt] = useState(() =>
    isoToDatetimeLocalValue(campaign.openAt),
  );
  const [newTotalStock, setNewTotalStock] = useState(
    campaign.totalStock != null ? String(campaign.totalStock) : "",
  );

  const shareUrl = `${window.location.origin}/campaigns/${campaign.shortCode}`;
  const isOpen = campaign.status === "OPEN";
  const isClosed = campaign.status === "CLOSED";

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSaveEdit() {
    setIsActing(true);
    setActionError("");
    try {
      await updateCampaign(campaign.id, {
        openAt: new Date(newOpenAt).toISOString(),
        totalStock: newTotalStock ? Number(newTotalStock) : undefined,
      });
      setIsEditing(false);
      await onRefetch();
    } catch (e) {
      const code = axios.isAxiosError(e)
        ? (e.response?.data as { code?: string })?.code
        : undefined;
      if (code === "OPEN_AT_NOT_DELAYABLE") {
        setActionError(
          "이미 오픈된 캠페인은 오픈 시각을 앞당길 수 없어요. 그대로 두거나 미루는 것만 가능해요.",
        );
      } else if (code === "TOTAL_STOCK_NOT_INCREASABLE") {
        setActionError(
          "이미 오픈된 캠페인은 정원을 줄일 수 없어요. 그대로 두거나 늘리는 것만 가능해요.",
        );
      } else if (code === "CAMPAIGN_CLOSED") {
        setActionError("종료된 캠페인은 오픈 시각을 바꿀 수 없어요.");
      } else {
        setActionError("수정 중 문제가 발생했어요.");
      }
    } finally {
      setIsActing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
        style={{
          borderColor: "var(--line)",
          backgroundColor: "var(--ink-soft)",
        }}
      >
        <span className="min-w-0 flex-1 truncate text-xs text-(--muted)">
          {shareUrl}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-(--on-brand)"
          style={{ backgroundColor: "var(--brand-blue)" }}
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>

      {isClosed ? (
        <p
          className="rounded-xl border px-4 py-3 text-xs text-(--muted)"
          style={{ borderColor: "var(--line)" }}
        >
          종료된 행사는 오픈 시각·정원을 바꿀 수 없어요.
        </p>
      ) : isEditing ? (
        <div
          className="flex flex-col gap-3 rounded-xl border p-4"
          style={{ borderColor: "var(--line)" }}
        >
          <DateTimePickerField
            label={
              isOpen ? "오픈 시각 (그대로 두거나 미루기만 가능)" : "오픈 시각"
            }
            value={newOpenAt}
            onChange={setNewOpenAt}
            // 이미 오픈된 캠페인은 원래 오픈 시각(이미 지난 시각일 수 있음)을 그대로
            // 유지하는 것도 허용해야 해서, 오늘이 아니라 원래 오픈 시각을 기준으로 함
            minDate={isOpen ? new Date(campaign.openAt) : undefined}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              정원{isOpen ? " (그대로 두거나 늘리기만 가능)" : ""}
            </span>
            <input
              type="number"
              min={isOpen ? (campaign.totalStock ?? 1) : 1}
              value={newTotalStock}
              onChange={(e) => setNewTotalStock(e.target.value)}
              className="input"
            />
          </label>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setIsEditing(false)}>
              취소
            </SecondaryButton>
            <PrimaryButton onClick={handleSaveEdit} disabled={isActing}>
              {isActing ? "저장 중..." : "저장"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <SecondaryButton onClick={() => setIsEditing(true)}>
          오픈시각·정원 수정
        </SecondaryButton>
      )}

      {!isClosed && (
        <button
          type="button"
          onClick={onClose}
          disabled={isActing}
          className="rounded-full border px-4 py-3 text-sm font-semibold disabled:opacity-40"
          style={{ borderColor: "var(--line)", color: "var(--paper)" }}
        >
          행사 종료 (신규 신청만 막기)
        </button>
      )}

      <button
        type="button"
        onClick={onDelete}
        disabled={isActing}
        className="rounded-full border px-4 py-3 text-sm font-semibold text-(--warn) transition-transform enabled:hover:scale-[1.01] disabled:opacity-40"
        style={{ borderColor: "var(--warn)" }}
      >
        행사 삭제
      </button>
    </div>
  );
}

// TODO: PrimaryButton/SecondaryButton은 CampaignDetailPage.tsx에도 똑같이 있음.
// 결제 기능을 아예 없애면서 관련 코드를 정리할 때, 이 중복도 shared/components로 합쳐서 같이 정리하면 됨.
function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full px-4 py-3 text-sm font-semibold text-(--on-yellow) transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40"
      style={{ backgroundColor: "var(--brand-yellow)" }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full border px-4 py-3 text-sm font-semibold disabled:opacity-40"
      style={{ borderColor: "var(--line)", color: "var(--paper)" }}
    >
      {children}
    </button>
  );
}
