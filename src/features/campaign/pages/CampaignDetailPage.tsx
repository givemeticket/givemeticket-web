import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  deleteCampaign,
  getCampaign,
  getCampaignStock,
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
import { Avatar } from "@/shared/components/Avatar";
import { getServerTimeOffset } from "@/shared/lib/serverTime";

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

  // 재고는 상세 정보와 분리된 별도 API. 새로고침(=이 페이지 재진입) 시에만 조회하고
  // 자동 폴링은 하지 않음 — 실시간 자동 갱신은 필요 없다고 확인됨.
  // 신청/취소/정원수정처럼 사용자가 직접 액션을 했을 때는 그 직후 refetchStock()로 갱신.
  const { data: stock, refetch: refetchStock } = useQuery({
    queryKey: ["campaignStock", campaign?.id],
    queryFn: () => getCampaignStock(campaign!.id),
    enabled: Boolean(campaign?.id),
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

  // 상세 조회 응답에 실린 재고는 "조회 시점 스냅샷". stock 쿼리가 아직 안 끝났으면
  // 이 스냅샷을 폴백으로 써서 빈 화면(재고 확인 중...)이 덜 보이게 함.
  // 이후 갱신(신청/취소 등)은 계속 stock 쿼리가 최신 출처가 됨.
  const remainingStock =
    stock?.remainingStock ?? campaign.remainingStock ?? undefined;
  const soldOut = stock?.soldOut ?? campaign.soldOut ?? false;
  const hasStockValue = stock !== undefined || campaign.remainingStock !== null;

  const meta =
    soldOut && campaign.status === "OPEN"
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
        await Promise.all([refetch(), refetchStock()]);
      }
    } catch (e) {
      const code = axios.isAxiosError(e)
        ? (e.response?.data as { code?: string })?.code
        : undefined;
      if (code === "SOLD_OUT") setActionError("방금 매진됐어요.");
      else if (code === "ALREADY_APPLIED")
        setActionError("이미 신청한 행사예요.");
      else if (code === "CAMPAIGN_NOT_OPEN")
        setActionError("아직 신청 오픈 전이에요.");
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
      await Promise.all([refetch(), refetchStock()]);
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

        <div className="mt-1 flex items-center gap-1.5 text-sm text-(--muted)">
          <Avatar
            src={campaign.owner.profileImageUrl}
            name={campaign.owner.nickname}
            size={16}
          />
          <span>
            {campaign.owner.nickname} · {formatDateTimeKo(campaign.openAt)} 오픈
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-1 text-sm text-(--muted)">
          {campaign.totalStock != null ? (
            <>
              <p className="text-base font-bold text-(--paper)">
                {hasStockValue ? remainingStock : "-"}개 남음
              </p>
              <p className="text-xs">
                {hasStockValue
                  ? campaign.totalStock - (remainingStock as number)
                  : "-"}{" "}
                / {campaign.totalStock}
              </p>
            </>
          ) : (
            <p>정원 제한 없음</p>
          )}
        </div>

        <div className="mt-8">
          {(campaign.viewerRole === "GUEST" ||
            campaign.viewerRole === "VIEWER") && (
            <ApplySection
              campaign={campaign}
              hasStockValue={hasStockValue}
              soldOut={soldOut}
              isActing={isActing}
              onApply={handleApply}
              onCampaignOpened={() => refetch()}
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
                onRefetch={async () => {
                  await Promise.all([refetch(), refetchStock()]);
                }}
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
                    hasStockValue={hasStockValue}
                    soldOut={soldOut}
                    isActing={isActing}
                    onApply={handleApply}
                    onCampaignOpened={() => refetch()}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {actionError && (
          <p className="mt-4 text-xs text-(--warn)">{actionError}</p>
        )}
      </div>
    </div>
  );
}

function ApplySection({
  campaign,
  hasStockValue,
  soldOut,
  isActing,
  onApply,
  onCampaignOpened,
}: {
  campaign: CampaignDetail;
  hasStockValue: boolean;
  soldOut: boolean;
  isActing: boolean;
  onApply: () => void;
  onCampaignOpened: () => void;
}) {
  if (campaign.status === "SCHEDULED") {
    return (
      <CountdownApplyButton
        openAt={campaign.openAt}
        isActing={isActing}
        onClick={onApply}
        onExpire={onCampaignOpened}
      />
    );
  }
  if (campaign.status === "CLOSED" || campaign.status === "DELETED") {
    return <SecondaryButton disabled>종료된 행사예요</SecondaryButton>;
  }
  if (!hasStockValue) {
    return <SecondaryButton disabled>재고 확인 중...</SecondaryButton>;
  }
  if (soldOut) {
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
  const isOpen = campaign.status === "OPEN";

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

      {isEditing ? (
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
  urgent = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** 임박 상태 강조 — 배경색을 경고색으로, 미세한 펄스 애니메이션 추가 */
  urgent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition-transform enabled:hover:scale-[1.02] enabled:active:scale-[0.98] disabled:opacity-40 ${urgent ? "countdown-urgent text-(--on-brand)" : "text-(--on-yellow)"}`}
      style={{
        backgroundColor: urgent ? "var(--warn)" : "var(--brand-yellow)",
      }}
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

function CountdownApplyButton({
  openAt,
  isActing,
  onClick,
  onExpire,
}: {
  openAt: string;
  isActing: boolean;
  onClick: () => void;
  onExpire: () => void;
}) {
  // 오차 측정 전엔 0(로컬 시계 그대로)으로 시작하고, 측정되면 그 값으로 갱신.
  // 카운트다운이 표시되자마자 살짝 튈 수는 있지만, 정확도가 훨씬 중요한 값이라 감수함.
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getServerTimeOffset()
      .then((o) => {
        if (!cancelled) setOffset(o);
      })
      .catch(() => {
        // 실패하면 그냥 로컬 시계(오차 0)로 계속 진행 — 카운트다운이 안 뜨는 것보단 나음
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const serverNow = () => Date.now() + offset;

  const [remainingMs, setRemainingMs] = useState(
    () => new Date(openAt).getTime() - serverNow(),
  );
  // 실제 API를 호출하는 버튼이라, 오픈 직전 광클로 요청이 과도하게 나가지 않도록
  // 아주 짧은 디바운스만 걸어둠 (isActing 중엔 어차피 막히지만, 응답이 빨리 오면
  // 바로 또 눌릴 수 있어서 이 정도 여유를 둠)
  const lastClickAtRef = useRef(0);
  const DEBOUNCE_MS = 200;

  useEffect(() => {
    const timer = setInterval(() => {
      const next = new Date(openAt).getTime() - serverNow();
      setRemainingMs(next);
      if (next <= 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAt, offset]);

  function handleClick() {
    const now = Date.now();
    if (now - lastClickAtRef.current < DEBOUNCE_MS) return;
    lastClickAtRef.current = now;
    onClick();
  }

  const label = isActing
    ? "처리 중..."
    : remainingMs <= 0
      ? "오픈됐어요"
      : `오픈까지 ${formatCountdown(remainingMs)} 남았어요`;

  const isUrgent = remainingMs > 0 && remainingMs <= 60_000;

  return (
    <PrimaryButton onClick={handleClick} disabled={isActing} urgent={isUrgent}>
      {label}
    </PrimaryButton>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);

  if (days >= 1) {
    return `${days}일`;
  }

  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) px-6 text-center text-sm text-(--muted)">
      {text}
    </div>
  );
}
