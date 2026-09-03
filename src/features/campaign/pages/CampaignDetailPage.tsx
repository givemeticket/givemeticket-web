import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { type CampaignItem } from "../api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Trash2, SearchX } from "lucide-react";
import { BackButton } from "@/shared/components/BackButton";
import { SecondaryButton } from "@/shared/components/buttons/SecondaryButton";
import { FullPageMessage } from "@/shared/components/feedback/FullPageMessage";
import { LoadingFade } from "@/shared/components/feedback/LoadingFade";
import { CampaignCard } from "../components/CampaignCard";
import { OwnerPanel } from "../components/OwnerPanel";
import { ApplySection } from "../components/ApplySection";
import { CopyLinkButton } from "../components/CopyLinkButton";
import { useCampaignDetailData } from "../hooks/useCampaignDetailData";
import { useShowCardLayoutId } from "../hooks/useShowCardLayoutId";
import { useCampaignActions } from "../hooks/useCampaignActions";
import { ConfirmDialog } from "@/shared/components/overlay/ConfirmDialog";
import { getCampaignCardLayoutId } from "../lib/campaignCardLayoutId";
import { FadeSlide } from "@/shared/animation/components/FadeSlide";
import { markReturningCampaign } from "@/shared/animation/pageTransition/returningCardStore";
import { useScrollOffsetSnap } from "@/shared/animation/pageTransition/useScrollOffsetSnap";
import { getScrollPosition } from "@/shared/animation/pageTransition/scrollPositionStore";

export function CampaignDetailPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const { cameFrom, showCardLayoutId, setIsNavigatingToNonCardPage } =
    useShowCardLayoutId(shortCode);

  // 목록에서 카드를 클릭해서 들어온 경우, 그 카드가 이미 갖고 있던 데이터를 그대로
  // 넘겨받음. 상세 API 응답을 기다리지 않고 이 데이터로 카드를 즉시 그릴 수 있어서,
  // "로딩 중엔 카드(layoutId)가 아예 없어서 이동 애니메이션이 짝을 못 찾는" 문제를 피함.
  const [placeholderCampaign] = useState(
    () => (location.state as { campaign?: CampaignItem } | null)?.campaign,
  );

  const { pendingScrollOffset, isScrollOffsetActive, hasSnappedScrollOffset } =
    useScrollOffsetSnap(() => getScrollPosition(location.pathname));
  // margin-top(오프셋)이 그대로 유지되고 있어도, 그 아래 실제 콘텐츠(카드 포함)가
  // layoutId 애니메이션이 끝나는 순간 실제로 살짝 짧아지면서 문서 전체 스크롤
  // 가능 높이가 줄어들고, 브라우저가 스크롤을 강제로 잘라내는(clamp) 문제가
  // 있었음(margin-top이 그대로인데도 scrollHeight는 줄어드는 걸 로그로 확인함 —
  // Framer Motion이 layoutId 애니메이션을 마무리하며 내부적으로 뭔가 정리하는
  // 과정에서 순간적으로 실제 레이아웃 높이가 줄어드는 것으로 추정). "딱 필요한
  // 만큼"이 아니라, 최소한 이 오프셋 + 뷰포트 높이만큼은 절대 안 줄어들도록 별도
  // 스페이서로 보장함 — 콘텐츠가 순간적으로 얼마나 짧아지든 이 최소 높이가
  // 스크롤 가능 영역을 지켜줌.
  const [viewportHeightAtMount] = useState(() => window.innerHeight);

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

  const {
    actionError,
    setActionError,
    isActing,
    handleApply,
    handleCancel,
    handleDelete,
    handleClose,
  } = useCampaignActions({
      campaign,
      shortCode,
      isAuthenticated,
      navigate,
      refetch,
      refetchStock,
    });

  // "취소/삭제/종료"는 되돌릴 수 없거나 영향이 커서 확인창을 거침. 어떤 액션을
  // 확인 중인지만 여기 담아두고, 실제 실행은 확인 버튼을 눌러야 함 (버튼 onClick에서
  // 바로 confirm()을 부르던 예전 방식과 달리, 다이얼로그가 뜬 뒤 비동기로 결정됨)
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "delete" | "close" | null
  >(null);

  // 삭제됨/못찾음은 콘텐츠랑 크로스페이드될 필요 없는 완전히 종결된 상태라 그대로 조기 반환.
  // "불러오는 중"은 아래 return의 LoadingFade가 담당함 (로딩→콘텐츠 크로스페이드를 위해선
  // 같은 AnimatePresence 안에서 둘 다 다뤄야 해서, 별도 조기 반환으로 빼면 안 됨)
  if (!cardSource && isError) {
    const status = axios.isAxiosError(error)
      ? error.response?.status
      : undefined;
    if (status === 410) {
      return (
        <FullPageMessage
          icon={<Trash2 size={32} strokeWidth={1.6} />}
          title="삭제된 행사예요"
          description="개설자가 이 행사를 삭제했어요."
        />
      );
    }
    return (
      <FullPageMessage
        icon={<SearchX size={32} strokeWidth={1.6} />}
        title="행사를 찾을 수 없어요"
        description="주소가 잘못됐거나, 더 이상 존재하지 않는 행사예요."
      />
    );
  }

  return (
    <LoadingFade isLoading={!cardSource && isLoading}>
      {cardSource && (
        <div className="relative h-full pt-8 pb-10 text-(--paper)">
          {/* 배경색 전용 레이어. 이것도 독립적으로 페이드시켜야 함 — 안 그러면 상세 페이지가
              사라지는 동안에도 이 불투명한 배경이 화면 전체를 계속 덮고 있어서, 그 밑에서
              동시에 나타나고 있는 목록 화면이 거의 끝까지 안 보이다가 마지막 순간에야
              갑자기 드러나는 문제가 생김. 카드의 자식이 아닌 별개 형제 요소라 카드엔 영향 없음. */}
          <FadeSlide className="absolute inset-0 -z-10 bg-(--ink)" slide={false} />

          <div
            className="mx-auto max-w-2xl px-6"
            style={
              isScrollOffsetActive && pendingScrollOffset !== null
                ? { marginTop: pendingScrollOffset }
                : undefined
            }
          >
            {/* 카드 위쪽 — < 티켓정보. 카드와 형제 요소라 카드의 투명도엔 영향 없음 */}
            <FadeSlide>
              <div className="flex items-center gap-1">
                {/* 스크롤 오프셋 보정은 이제 RootLayout(UserApp.tsx)이 모든
                    목록↔상세 전환에서 일괄적으로 계산해줌 — 예전엔 이 버튼을
                    누르는 순간 직접 markPendingScrollOffset을 호출했어야 했지만,
                    그러면 브라우저 자체의 뒤로가기/앞으로가기(이 버튼을 거치지
                    않는 경우)엔 보정이 안 걸리는 문제가 있었음. */}
                {cameFrom && (
                  <BackButton
                    fallback={`/${cameFrom}`}
                    onBeforeNavigate={() => {
                      // showCardLayoutId가 꺼져있으면(새로고침 등으로 들어와
                      // 카드가 애초에 layoutId 없이 페이드만 하는 중) 표시할
                      // 게 없음 — 목록 쪽에 짝 없는 "이동 중" 신호만 잘못
                      // 전달하게 됨.
                      if (showCardLayoutId && cardSource) {
                        markReturningCampaign(cardSource.id);
                      }
                    }}
                  />
                )}
                <h1 className="text-lg font-bold">티켓정보</h1>
              </div>
            </FadeSlide>

            {/* [캠페인 카드] — 목록 카드와 같은 layoutId로 이동 애니메이션만 독립적으로 진행.
                진짜 상세 데이터가 아직이면 넘겨받은 목록 데이터(cardSource)로 즉시 그림.
                showCardLayoutId가 꺼져있으면(새로고침으로 들어온 최초 마운트, 또는 카드
                없는 페이지로 이동 중) layoutId를 아예 안 주고, 대신 카드도 다른 요소들처럼
                페이드로 처리함. */}
            <FadeSlide className="mt-4" disabled={showCardLayoutId}>
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
                layoutId={
                  showCardLayoutId
                    ? getCampaignCardLayoutId(cardSource.id)
                    : undefined
                }
                layoutDurationOverride={hasSnappedScrollOffset ? 0 : undefined}
              />
            </FadeSlide>

            {/* 카드 아래쪽 — 링크복사/관리 + 신청하기·취소 + 에러 문구. 역시 카드와 형제 요소.
                여긴 viewerRole/myApplication처럼 진짜 상세 데이터가 있어야만 정확히 그릴 수
                있어서, campaign(진짜 데이터)이 도착하기 전까진 간단한 대기 문구만 보여줌 */}
            <FadeSlide>
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
                        onBeforeNavigateToNonCardPage={() =>
                          setIsNavigatingToNonCardPage(true)
                        }
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
                            {myApplicationDetail?.appliedAt
                              ? formatDateTimeKo(myApplicationDetail.appliedAt)
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
            </FadeSlide>
          </div>

          {/* 스크롤 오프셋(margin-top)이 정확한 위치 보정을 담당하는 동안, 그 아래 실제
              콘텐츠(카드 포함)가 layoutId 애니메이션 완료 시점에 순간적으로 살짝
              짧아지면서 문서 전체 스크롤 가능 높이가 오프셋만큼도 못 채우게 되는
              문제가 있었음(margin-top 자체는 그대로 유지되는데도 scrollHeight가
              줄어드는 걸 로그로 확인함 — Framer Motion이 layoutId 애니메이션을
              마무리하며 내부적으로 뭔가 정리하는 과정에서 순간적으로 실제 레이아웃
              높이가 줄어드는 것으로 추정). 콘텐츠의 위치엔 영향 없이(형제 요소로,
              margin-top 없이) 문서 맨 끝에 여유 공간만 추가로 확보해서, 콘텐츠가
              얼마나 짧아지든 전체 문서가 절대 이 밑으로는 안 줄어들게 함.
              브라우저가 스크롤을 강제로 잘라낼 일이 없어짐. */}
          {isScrollOffsetActive && pendingScrollOffset !== null && (
            <div aria-hidden style={{ height: viewportHeightAtMount }} />
          )}

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
      )}
    </LoadingFade>
  );
}
