import { useState, type ReactNode } from "react";
import axios from "axios";
import { Ban, Pencil, Trash2 } from "lucide-react";
import { updateCampaign, type CampaignDetail } from "../api/campaignApi";
import { isoToDatetimeLocalValue } from "@/shared/lib/formatDate";
import { DateTimePickerField } from "@/shared/components/DateTimePickerField";
import { IconButton } from "@/shared/components/IconButton";

// 관리자(개설자) 전용 패널 — 아이콘 한 줄(수정/종료/삭제).
// 링크 복사는 역할과 무관하게 누구나 볼 수 있어야 해서 별도 CopyLinkButton으로 분리됨.
// "수정"만 누르면 그 아래에 인라인 폼이 펼쳐짐. 참여(신청/취소) 관련 UI는
// 여기 없음 — 상세 페이지의 공통 "신청하기/신청취소" 섹션이 역할과 무관하게 처리함.
export function OwnerPanel({
  campaign,
  isActing,
  setIsActing,
  setActionError,
  onDelete,
  onClose,
  onRefetch,
  leadingContent,
}: {
  campaign: CampaignDetail;
  isActing: boolean;
  setIsActing: (v: boolean) => void;
  setActionError: (v: string) => void;
  onDelete: () => void;
  onClose: () => void;
  onRefetch: () => Promise<unknown>;
  /** 아이콘 행 맨 앞에 같이 넣을 요소 (예: 누구나 볼 수 있는 링크 복사 버튼) */
  leadingContent?: ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newOpenAt, setNewOpenAt] = useState(() =>
    isoToDatetimeLocalValue(campaign.openAt),
  );
  const [newTotalStock, setNewTotalStock] = useState(
    campaign.totalStock != null ? String(campaign.totalStock) : "",
  );

  const isOpen = campaign.status === "OPEN";
  const isClosed = campaign.status === "CLOSED";

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {leadingContent}

        {!isClosed && (
          <IconButton
            onClick={() => setIsEditing((v) => !v)}
            label="수정"
            active={isEditing}
          >
            <Pencil size={17} strokeWidth={1.7} />
          </IconButton>
        )}

        {!isClosed && (
          <IconButton onClick={onClose} label="종료" disabled={isActing}>
            <Ban size={17} strokeWidth={1.7} />
          </IconButton>
        )}

        <IconButton
          onClick={onDelete}
          label="삭제"
          disabled={isActing}
          tone="warn"
        >
          <Trash2 size={17} strokeWidth={1.7} />
        </IconButton>
      </div>

      {isEditing && (
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
            resetToNowOnOpen={isOpen}
            originalValue={isoToDatetimeLocalValue(campaign.openAt)}
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
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-full border px-4 py-2.5 text-sm font-medium"
              style={{ borderColor: "var(--line)", color: "var(--paper)" }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isActing}
              className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-(--on-yellow) disabled:opacity-40"
              style={{ backgroundColor: "var(--brand-yellow)" }}
            >
              {isActing ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
