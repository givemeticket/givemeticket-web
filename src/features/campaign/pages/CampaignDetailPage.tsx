import { useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  closeCampaign,
  deleteCampaign,
  getCampaign,
  getCampaignStock,
  type CampaignDetail,
  type CampaignStatus,
} from "../api/campaignApi";
import {
  applyToCampaign,
  cancelApplication,
} from "@/features/application/api/applicationApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ChevronLeftIcon } from "@/shared/components/BackButton";
import { Avatar } from "@/shared/components/Avatar";
import { OwnerPanel } from "../components/OwnerPanel";
import { CountdownApplyButton } from "../components/CountdownApplyButton";

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
  DELETED: { label: "삭제됨", bg: "var(--deleted)", fg: "var(--paper)" },
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

  async function handleClose() {
    if (
      !confirm(
        "신청을 종료하시겠어요? 새 신청만 막히고, 이미 확정된 신청은 취소·환불 없이 그대로 유지돼요. 되돌릴 수 없어요.",
      )
    )
      return;
    setIsActing(true);
    setActionError("");
    try {
      await closeCampaign(campaign!.id);
      await refetch();
    } catch {
      setActionError("종료 중 문제가 발생했어요.");
    } finally {
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
                onClose={handleClose}
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

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) px-6 text-center text-sm text-(--muted)">
      {text}
    </div>
  );
}
