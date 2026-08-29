import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import {
  applyToCampaign,
  cancelApplication,
  closeCampaign,
  deleteCampaign,
  type CampaignDetail,
  type CampaignItem,
} from "../api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Check, Link2 } from "lucide-react";
import { BackButton } from "@/shared/components/BackButton";
import { IconButton } from "@/shared/components/IconButton";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { CampaignCard } from "../components/CampaignCard";
import { OwnerPanel } from "../components/OwnerPanel";
import { useCampaignDetailData } from "../hooks/useCampaignDetailData";
import { CountdownApplyButton } from "../components/CountdownApplyButton";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

/** 어디서 이 페이지로 들어왔는지 — 대시보드 탭에서 카드 클릭 시에만 명시적으로 실어서 넘김.
 * 공유 링크로 직접 들어오거나 주소를 직접 입력한 경우엔 이 값이 없어서 뒤로가기 버튼이 안 보임. */
type NavigationSource = "mycampaigns" | "mytickets";

export function CampaignDetailPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const cameFrom = (location.state as { from?: NavigationSource } | null)?.from;
  // 목록에서 카드를 클릭해서 들어온 경우, 그 카드가 이미 갖고 있던 데이터를 그대로
  // 넘겨받음. 상세 API 응답을 기다리지 않고 이 데이터로 카드를 즉시 그릴 수 있어서,
  // "로딩 중엔 카드(layoutId)가 아예 없어서 이동 애니메이션이 짝을 못 찾는" 문제를 피함.
  const placeholderCampaign = (
    location.state as { campaign?: CampaignItem } | null
  )?.campaign;

  const {
    campaign,
    cardSource,
    cardImageUrl,
    isLoading,
    isError,
    error,
    refetch,
    refetchStock,
    remainingStock,
    soldOut,
    hasStockValue,
    hasActiveApplication,
    myApplicationDetail,
  } = useCampaignDetailData(shortCode, placeholderCampaign);

  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);
  // "취소/삭제/종료"는 되돌릴 수 없거나 영향이 커서 확인창을 거침. 어떤 액션을
  // 확인 중인지만 여기 담아두고, 실제 실행은 확인 버튼을 눌러야 함 (버튼 onClick에서
  // 바로 confirm()을 부르던 예전 방식과 달리, 다이얼로그가 뜬 뒤 비동기로 결정됨)
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "delete" | "close" | null
  >(null);

  // 진짜 상세 데이터도, 넘겨받은 목록 데이터도 둘 다 없을 때만 로딩/에러 화면
  if (!cardSource) {
    if (isLoading) return <CenteredMessage text="불러오는 중..." />;
    if (isError) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      if (status === 410) return <CenteredMessage text="삭제된 행사예요." />;
      return <CenteredMessage text="행사를 찾을 수 없어요." />;
    }
    return null;
  }

  async function handleApply() {
    if (!isAuthenticated) {
      navigate(`/?redirect=${encodeURIComponent(`/campaigns/${shortCode}`)}`);
      return;
    }
    setIsActing(true);
    setActionError("");
    try {
      await applyToCampaign(campaign!.id);
      await Promise.all([refetch(), refetchStock()]);
    } catch (e) {
      const code = axios.isAxiosError(e)
        ? (e.response?.data as { code?: string })?.code
        : undefined;
      if (code === "SOLD_OUT") setActionError("남은 티켓이 없어요.");
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
    <div className="relative min-h-screen pt-8 pb-10 text-(--paper)">
      {/* 배경색 전용 레이어. 이것도 독립적으로 페이드시켜야 함 — 안 그러면 상세 페이지가
          사라지는 동안에도 이 불투명한 배경이 화면 전체를 계속 덮고 있어서, 그 밑에서
          동시에 나타나고 있는 목록 화면이 거의 끝까지 안 보이다가 마지막 순간에야
          갑자기 드러나는 문제가 생김. 카드의 자식이 아닌 별개 형제 요소라 카드엔 영향 없음. */}
      <motion.div
        className="absolute inset-0 -z-10 bg-(--ink)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />

      <div className="mx-auto max-w-2xl px-6">
        {/* 카드 위쪽 — < 티켓정보. 카드와 형제 요소라 카드의 투명도엔 영향 없음 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-1">
            {cameFrom && <BackButton fallback={`/${cameFrom}`} />}
            <h1 className="text-lg font-bold">티켓정보</h1>
          </div>
        </motion.div>

        {/* [캠페인 카드] — 목록 카드와 같은 layoutId로 이동 애니메이션만 독립적으로 진행.
            진짜 상세 데이터가 아직이면 넘겨받은 목록 데이터(cardSource)로 즉시 그림 */}
        <div className="mt-4">
          <CampaignCard
            title={cardSource.title}
            status={cardSource.status}
            soldOut={soldOut}
            openAtLabel={`${formatDateTimeKo(cardSource.openAt)} 오픈`}
            remainingStock={
              cardSource.totalStock != null && hasStockValue
                ? remainingStock
                : undefined
            }
            totalStock={cardSource.totalStock ?? undefined}
            ownerNickname={cardSource.owner.nickname}
            ownerProfileImageUrl={cardSource.owner.profileImageUrl}
            imageUrl={cardImageUrl}
            interactive={false}
            layoutId={`campaign-card-${cardSource.id}`}
          />
        </div>

        {/* 카드 아래쪽 — 링크복사/관리 + 신청하기·취소 + 에러 문구. 역시 카드와 형제 요소.
            여긴 viewerRole/myApplication처럼 진짜 상세 데이터가 있어야만 정확히 그릴 수
            있어서, campaign(진짜 데이터)이 도착하기 전까진 간단한 대기 문구만 보여줌 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {!campaign ? (
            <p className="mt-4 text-sm text-(--muted)">불러오는 중...</p>
          ) : (
            <>
              {/* 링크 복사(누구나) + 관리 아이콘(수정/삭제/종료, 관리자만) — 같은 줄 */}
              <div className="mt-4">
                {campaign.viewerRole === "OWNER" ? (
                  <OwnerPanel
                    campaign={campaign}
                    isActing={isActing}
                    onDelete={() => setConfirmAction("delete")}
                    onClose={() => setConfirmAction("close")}
                    leadingContent={
                      <CopyLinkButton
                        url={`${window.location.origin}/campaigns/${campaign.shortCode}`}
                      />
                    }
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <CopyLinkButton
                      url={`${window.location.origin}/campaigns/${campaign.shortCode}`}
                    />
                  </div>
                )}
              </div>

              {/* 신청하기 / 신청취소 — 역할과 무관하게 공통 처리 (관리자도 신청 가능) */}
              <div className="mt-6 flex justify-center">
                {hasActiveApplication && campaign.myApplication ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-(--muted)">
                      신청시각:{" "}
                      <span className="font-semibold text-(--paper)">
                        {myApplicationDetail
                          ? formatDateTimeKo(myApplicationDetail.createdAt)
                          : "불러오는 중..."}
                      </span>
                    </p>
                    {campaign.status !== "CLOSED" && (
                      <SecondaryButton
                        onClick={() => setConfirmAction("cancel")}
                        disabled={isActing}
                      >
                        {isActing ? "처리 중..." : "신청 취소"}
                      </SecondaryButton>
                    )}
                  </div>
                ) : (
                  <ApplySection
                    campaign={campaign}
                    hasStockValue={hasStockValue}
                    isActing={isActing}
                    onApply={handleApply}
                    onCampaignOpened={() => {
                      refetch();
                      setActionError("");
                    }}
                  />
                )}
              </div>

              {actionError && (
                <p className="mt-4 text-xs text-(--warn)">{actionError}</p>
              )}
            </>
          )}
        </motion.div>
      </div>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={
          confirmAction === "delete"
            ? "정말 삭제하시겠어요?"
            : confirmAction === "close"
              ? "신청을 종료하시겠어요?"
              : "신청을 취소하시겠어요?"
        }
        description={
          confirmAction === "delete"
            ? "신청자가 있어도 전부 취소되고, 되돌릴 수 없어요."
            : confirmAction === "close"
              ? "새 신청만 막히고, 이미 확정된 신청은 그대로 유지돼요. 되돌릴 수 없어요."
              : undefined
        }
        confirmLabel={
          confirmAction === "delete"
            ? "삭제"
            : confirmAction === "close"
              ? "종료"
              : "취소하기"
        }
        danger={confirmAction === "delete"}
        onConfirm={() => {
          const action = confirmAction;
          setConfirmAction(null);
          if (action === "delete") handleDelete();
          else if (action === "close") handleClose();
          else if (action === "cancel") handleCancel();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function ApplySection({
  campaign,
  hasStockValue,
  isActing,
  onApply,
  onCampaignOpened,
}: {
  campaign: CampaignDetail;
  hasStockValue: boolean;
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
  // 매진 표시가 있어도 신청 버튼 자체는 막지 않음 — 취소표가 나올 수 있어서.
  // 실제로 여전히 매진이면 handleApply의 catch에서 SOLD_OUT 에러로 안내됨
  return (
    <PrimaryButton onClick={onApply} disabled={isActing}>
      {isActing ? "처리 중..." : "신청하기"}
    </PrimaryButton>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <IconButton
      onClick={handleCopy}
      label={copied ? "복사됨" : "링크 복사"}
      active={copied}
    >
      {copied ? (
        <Check size={17} strokeWidth={1.8} />
      ) : (
        <Link2 size={17} strokeWidth={1.7} />
      )}
    </IconButton>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-(--ink) px-6 text-center text-sm text-(--muted)">
      {text}
    </div>
  );
}
