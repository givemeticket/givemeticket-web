import { useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  deleteCampaign,
  getCampaign,
  updateCampaign,
  type CampaignDetail,
  type CampaignStatus,
} from "../api/campaignApi";
import {
  applyToCampaign,
  cancelApplication,
} from "@/features/application/api/applicationApi";
import {
  formatDateTimeKo,
  isoToDatetimeLocalValue,
} from "@/shared/lib/formatDate";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChevronLeftIcon } from "@/shared/components/BackButton";
import { DateTimePickerField } from "@/shared/components/DateTimePickerField";

/** 어디서 이 페이지로 들어왔는지 — 대시보드 탭에서 카드 클릭 시에만 명시적으로 실어서 넘김.
 * 공유 링크로 직접 들어오거나 주소를 직접 입력한 경우엔 이 값이 없어서 뒤로가기 버튼이 안 보임. */
type NavigationSource = "mycampaigns" | "mytickets";

const STATUS_META: Record<
  CampaignStatus,
  { label: string; bg: string; fg: string }
> = {
  SCHEDULED: {
    label: "예정",
    bg: "var(--brand-blue-dim)",
    fg: "var(--on-brand)",
  },
  OPEN: { label: "진행중", bg: "var(--brand-yellow)", fg: "var(--on-yellow)" },
  CLOSED: { label: "종료", bg: "var(--ink-soft)", fg: "var(--muted)" },
  DELETED: { label: "삭제됨", bg: "var(--ink-soft)", fg: "var(--muted)" },
};

export function CampaignDetailPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const cameFrom = (location.state as { from?: NavigationSource } | null)?.from;

  const {
    data: campaign,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaign", shortCode],
    queryFn: () => getCampaign(shortCode!),
    enabled: Boolean(shortCode),
  });

  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);

  if (isLoading) return <CenteredMessage text="불러오는 중..." />;

  if (isError) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    if (status === 410) return <CenteredMessage text="삭제된 행사예요." />;
    return <CenteredMessage text="행사를 찾을 수 없어요." />;
  }
  if (!campaign) return null;

  const meta =
    campaign.soldOut && campaign.status === "OPEN"
      ? { label: "매진", bg: "var(--warn)", fg: "var(--on-brand)" }
      : STATUS_META[campaign.status];

  async function handleApply() {
    if (!isAuthenticated) {
      navigate(`/?redirect=${encodeURIComponent(`/campaigns/${shortCode}`)}`);
      return;
    }
    setIsActing(true);
    setActionError("");
    try {
      const result = await applyToCampaign(campaign!.id);
      if (result.status === "PENDING") {
        navigate(`/checkout/${result.id}`);
      } else {
        await refetch();
      }
    } catch (e) {
      const code = axios.isAxiosError(e)
        ? (e.response?.data as { code?: string })?.code
        : undefined;
      if (code === "SOLD_OUT") setActionError("방금 매진됐어요.");
      else if (code === "ALREADY_APPLIED")
        setActionError("이미 신청한 행사예요.");
      else setActionError("신청 중 문제가 발생했어요.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleCancel() {
    if (!campaign!.myApplication) return;
    if (!confirm("신청을 취소하시겠어요?")) return;
    setIsActing(true);
    setActionError("");
    try {
      await cancelApplication(campaign!.myApplication.id);
      await refetch();
    } catch {
      setActionError("취소 중 문제가 발생했어요.");
    } finally {
      setIsActing(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "정말 삭제하시겠어요? 신청자가 있어도 전부 취소·환불되고, 되돌릴 수 없어요.",
      )
    )
      return;
    setIsActing(true);
    setActionError("");
    try {
      await deleteCampaign(campaign!.id);
      navigate("/mycampaigns", { replace: true });
    } catch {
      setActionError("삭제 중 문제가 발생했어요.");
      setIsActing(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--ink) px-6 py-10 text-(--paper)">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-1">
          {cameFrom && (
            <button
              type="button"
              onClick={() => navigate(`/${cameFrom}`)}
              aria-label="뒤로가기"
              className="rounded-full p-1 text-(--paper)"
            >
              <ChevronLeftIcon />
            </button>
          )}

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="truncate text-xl font-bold">{campaign.title}</h1>

            <span
              className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: meta.bg, color: meta.fg }}
            >
              {meta.label}
            </span>
          </div>
        </div>

        <p className="mt-1 text-sm text-(--muted)">
          {formatDateTimeKo(campaign.openAt)} 오픈
        </p>

        <div className="mt-4 flex flex-col gap-1 text-sm text-(--muted)">
          {campaign.totalStock != null ? (
            <p>
              잔여{" "}
              <span className="font-semibold text-(--paper)">
                {campaign.remainingStock} / {campaign.totalStock}
              </span>
            </p>
          ) : (
            <p>정원 제한 없음</p>
          )}
          <p>참여 확정 {campaign.confirmedCount}명</p>
        </div>

        {actionError && (
          <p className="mt-4 text-xs text-(--warn)">{actionError}</p>
        )}

        <div className="mt-8">
          {campaign.viewerRole === "GUEST" && (
            <PrimaryButton onClick={handleApply}>
              로그인하고 신청하기
            </PrimaryButton>
          )}

          {campaign.viewerRole === "VIEWER" && (
            <ApplySection
              campaign={campaign}
              isActing={isActing}
              onApply={handleApply}
            />
          )}

          {campaign.viewerRole === "PARTICIPANT" && campaign.myApplication && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-(--muted)">
                내 신청 상태:{" "}
                <span className="font-semibold text-(--paper)">
                  {campaign.myApplication.status}
                </span>
              </p>
              <SecondaryButton onClick={handleCancel} disabled={isActing}>
                {isActing ? "처리 중..." : "신청 취소"}
              </SecondaryButton>
            </div>
          )}

          {campaign.viewerRole === "OWNER" && (
            <div className="flex flex-col gap-6">
              <OwnerPanel
                campaign={campaign}
                isActing={isActing}
                setIsActing={setIsActing}
                setActionError={setActionError}
                onDelete={handleDelete}
                onRefetch={refetch}
              />

              <div
                className="border-t pt-6"
                style={{ borderColor: "var(--line)" }}
              >
                {campaign.myApplication ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-(--muted)">
                      내 신청 상태:{" "}
                      <span className="font-semibold text-(--paper)">
                        {campaign.myApplication.status}
                      </span>
                    </p>
                    <SecondaryButton onClick={handleCancel} disabled={isActing}>
                      {isActing ? "처리 중..." : "신청 취소"}
                    </SecondaryButton>
                  </div>
                ) : (
                  <ApplySection
                    campaign={campaign}
                    isActing={isActing}
                    onApply={handleApply}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ApplySection({
  campaign,
  isActing,
  onApply,
}: {
  campaign: CampaignDetail;
  isActing: boolean;
  onApply: () => void;
}) {
  if (campaign.status === "SCHEDULED") {
    return <SecondaryButton disabled>아직 신청 오픈 전이에요</SecondaryButton>;
  }
  if (campaign.status === "CLOSED" || campaign.status === "DELETED") {
    return <SecondaryButton disabled>종료된 행사예요</SecondaryButton>;
  }
  if (campaign.soldOut) {
    return <SecondaryButton disabled>매진됐어요</SecondaryButton>;
  }
  return (
    <PrimaryButton onClick={onApply} disabled={isActing}>
      {isActing ? "처리 중..." : "신청하기"}
    </PrimaryButton>
  );
}

function OwnerPanel({
  campaign,
  isActing,
  setIsActing,
  setActionError,
  onDelete,
  onRefetch,
}: {
  campaign: CampaignDetail;
  isActing: boolean;
  setIsActing: (v: boolean) => void;
  setActionError: (v: string) => void;
  onDelete: () => void;
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
    } catch {
      setActionError(
        "수정 중 문제가 발생했어요. (오픈 시각은 늦추는 방향, 정원은 늘리는 방향으로만 가능해요)",
      );
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

      {isEditing ? (
        <div
          className="flex flex-col gap-3 rounded-xl border p-4"
          style={{ borderColor: "var(--line)" }}
        >
          <DateTimePickerField
            label="오픈 시각 (지연만 가능)"
            value={newOpenAt}
            onChange={setNewOpenAt}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">정원 (증원만 가능)</span>
            <input
              type="number"
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

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) px-6 text-center text-sm text-(--muted)">
      {text}
    </div>
  );
}
