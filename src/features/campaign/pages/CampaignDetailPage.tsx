import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
} from "react-router-dom";
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
import { Trash2, SearchX } from "lucide-react";
import { BackButton } from "@/shared/components/BackButton";
import { IconButton } from "@/shared/components/IconButton";
import { PrimaryButton } from "@/shared/components/PrimaryButton";
import { SecondaryButton } from "@/shared/components/SecondaryButton";
import { FullPageMessage } from "@/shared/components/FullPageMessage";
import { LoadingFade } from "@/shared/components/LoadingFade";
import { CampaignCard } from "../components/CampaignCard";
import { OwnerPanel } from "../components/OwnerPanel";
import { useCampaignDetailData } from "../hooks/useCampaignDetailData";
import { CountdownApplyButton } from "../components/CountdownApplyButton";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { consumeLeftToNonCardPage } from "../lib/leftToNonCardPageStore";
import { isInitialDetailPageMount } from "../lib/initialDetailMountStore";
import { markReturningCampaign } from "../lib/returningCardStore";
import { consumePendingScrollOffset } from "@/shared/lib/scrollOffsetStore";
import { getScrollPosition } from "@/shared/lib/scrollPositionStore";
import {
  PAGE_TRANSITION_DURATION,
  POST_ANIMATION_DELAY_MS,
} from "@/shared/lib/animationDurations";

/** 어디서 이 페이지로 들어왔는지 — 대시보드 탭에서 카드 클릭 시에만 명시적으로 실어서 넘김.
 * 공유 링크로 직접 들어오거나 주소를 직접 입력한 경우엔 이 값이 없어서 뒤로가기 버튼이 안 보임. */
type NavigationSource = "mycampaigns" | "mytickets";

export function CampaignDetailPage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // 마운트되는 순간 딱 한 번만 값을 붙잡아둠(useState의 lazy initializer). location은
  // 전역 값이라, 뒤로가기를 누르면 이 컴포넌트가 아직 exit 애니메이션 재생 중(=화면에
  // 남아있는 상태)이어도 라우터가 이미 바뀐 새 경로/state를 그대로 반영해버림 — 그러면
  // cameFrom이 순간 undefined가 되면서, 페이지 전체가 사라지기도 전에 뒤로가기 버튼만
  // 먼저 사라지는 문제가 있었음. 한 번 캡처해두면 이후 라우터가 어떻게 바뀌든 무관해짐.
  const [cameFrom] = useState(
    () => (location.state as { from?: NavigationSource } | null)?.from,
  );

  // cameFrom과 같은 이유로 마운트 시점에 한 번만 고정 — layoutId를 쓸지는 마운트
  // 시점에 한 번 결정하고 인스턴스가 살아있는 동안 절대 바꾸면 안 됨. 얼려두지
  // 않으면, 이 페이지가 아직 exit 애니메이션 중일 때 라우터의 navigationType이
  // 이미 다음 값으로 바뀌어버려서 이 원칙이 깨짐.
  const rawNavigationType = useNavigationType();
  const [navigationType] = useState(() => rawNavigationType);
  // 카드 없는 화면(수정/신청자 목록)에서 막 돌아온 경우 — 이것도 이 인스턴스가
  // 살아있는 내내 영구 고정임. navigationType만으론 이 경우를 구분할 수 없어서
  // (아래 showCardLayoutId 주석 참고) 별도로 필요함.
  const [cameFromNonCardPage] = useState(() =>
    consumeLeftToNonCardPage(shortCode ?? ""),
  );
  // 이 세션이 새로고침(또는 공유 링크)으로 이 상세 페이지에 바로 들어온
  // 경우 — 이것도 이 인스턴스가 살아있는 내내 영구 고정임. cameFrom/navigationType
  // 만으론 이 경우를 구분할 수 없어서(아래 showCardLayoutId 주석 참고) 별도로
  // 필요함.
  const [isRefreshMount] = useState(() => isInitialDetailPageMount());
  // "수정"/"신청자 목록"처럼 캠페인 카드 자체가 없는 페이지로 이동하려는 참이면 true.
  // OwnerPanel이 그 버튼을 누르는 순간(navigate 직전) 동기적으로 이 값을 켜줌.
  const [isNavigatingToNonCardPage, setIsNavigatingToNonCardPage] =
    useState(false);
  // 목록 카드는 항상(예외 없이) layoutId를 갖고 있음(CampaignListTab.tsx 참고) —
  // 그래서 상세 쪽이 layoutId를 켤지 말지는 "지금 목록에 정말 그 짝이 있는지"를
  // 최대한 정확히 추정해야 함. 처음엔 "목록 클릭(PUSH)으로 들어왔는지"만 보면
  // 될 줄 알았는데, 실제로 확인해보니 그것만으론 부족함:
  // - navigationType === "PUSH": navigate()로 만든 새 히스토리 항목에서만 성립.
  //   진짜 새 클릭 진입은 항상 이걸 만족함.
  // - 문제는 POP(뒤로/앞으로가기)을 전부 뭉뚱그려 끄면 안 된다는 것 — "목록 클릭
  //   으로 만들어진 항목에 브라우저 *앞으로가기*로 재진입"하는 경우도 POP인데,
  //   이땐 목록 카드가 여전히 layoutId를 갖고 있어서 상세도 맞춰서 켜야 함. 안
  //   그러면 목록 카드가 상대를 못 찾고 방치되다가, 그 화면 다른 요소들 페이드가
  //   끝나야 사라지면서 상세 페이지가 늦게 "갑자기" 나타나는 것처럼 보임
  //   (animation.md 3번과 같은 종류 — 실제로 겪은 버그. cameFromNonCardPage
  //   없이 navigationType만 썼다가 재현됨).
  // - 반대로 "카드 없는 화면에서 뒤로가기로 돌아옴"도 POP이지만, 이땐 짝(그
  //   화면엔 카드가 없었음)이 없으니 꺼야 함.
  // - 그런데 "이 상세 페이지 자체에서 새로고침"도 POP으로 보고되고, cameFrom도
  //   (location.state가 새로고침에도 살아남아서) 그대로 true로 남아있음 — 즉
  //   "새로고침"과 "브라우저 앞으로가기로 재진입"이 navigationType+cameFrom+
  //   cameFromNonCardPage만으로는 구분이 안 됨(실제로 겪은 버그 — 새로고침
  //   후 뒤로가기 시 카드가 짝 없이 layoutId로 이동하려다 엉뚱한 곳으로
  //   사라짐). isRefreshMount로 이 경우만 따로 걸러냄.
  // 결국 POP 중에서도 "카드 없는 화면에서 왔는지"만 따로 구분해야 해서
  // cameFromNonCardPage가 필요함 — PUSH면 무조건 켜고, POP이면 "카드 없는
  // 화면에서 온 게 아닐 때만" 켬. 새로고침이면 그 무엇과도 무관하게 항상 끔.
  //
  // isNavigatingToNonCardPage도 여기 넣음 — "수정"/"신청자 목록"으로 떠나려는
  // 참이면 그 즉시 layoutId를 끔. 마운트 이후 동적으로 껐다 켜는 거라 원칙
  // (animation.md 1번)엔 안 맞고 카드가 순간 살짝 흐려졌다 풀렸다 다시
  // 페이드되는 미세한 깜빡임이 있는데(opacity만 따로 조절하는 방식으로
  // 없애보려 했었으나, 실제로는 안 없어지고 오히려 "카드 없는 화면을 한 번이라도
  // 거친 뒤 목록으로 돌아갈 때 이동 애니메이션이 아예 없어지는" 더 큰 부작용만
  // 생겨서 이 방식으로 되돌림) — 사용자가 감수하기로 함. TODO.md 참고.
  const showCardLayoutId =
    !isRefreshMount &&
    cameFrom !== undefined &&
    (navigationType === "PUSH" || !cameFromNonCardPage) &&
    !isNavigatingToNonCardPage;
  // 목록에서 카드를 클릭해서 들어온 경우, 그 카드가 이미 갖고 있던 데이터를 그대로
  // 넘겨받음. 상세 API 응답을 기다리지 않고 이 데이터로 카드를 즉시 그릴 수 있어서,
  // "로딩 중엔 카드(layoutId)가 아예 없어서 이동 애니메이션이 짝을 못 찾는" 문제를 피함.
  const [placeholderCampaign] = useState(
    () => (location.state as { campaign?: CampaignItem } | null)?.campaign,
  );

  // 목록에서 카드를 클릭해서 들어온 경우, 그 클릭 시점의 목록 스크롤값이 여기 담겨
  // 있음(없으면 null — 새로고침으로 들어왔거나 카드 클릭이 아닌 다른 경로로 온 경우).
  // 마운트 시점에 한 번만 소비함.
  const [pendingScrollOffset] = useState(() => consumePendingScrollOffset());
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
  // 오프셋이 실제로 걸려있는 상태인지. 애니메이션이 끝나면 false로 바뀌면서
  // 오프셋을 제거함과 동시에 진짜 스크롤을 이 페이지의 목표값으로 맞춤 — 이 둘이
  // 정확히 동시에 일어나야 화면상 아무 변화 없이 "순간이동"됨(자세한 원리는
  // scrollOffsetStore.ts 참고).
  const [isScrollOffsetActive, setIsScrollOffsetActive] = useState(
    pendingScrollOffset !== null,
  );
  // 오프셋을 없애는 그 순간, 카드의 이동 duration을 0으로 강제해서 즉시 반영되게
  // 함 — 안 그러면 오프셋 제거로 카드 측정 위치가 바뀌는 걸 Framer Motion이 "또
  // 다른 이동"으로 착각해서, 의도치 않은 두 번째 애니메이션을 자체적으로
  // 걸어버리는 문제가 있었음(로그로 확인함).
  const [hasSnappedScrollOffset, setHasSnappedScrollOffset] = useState(false);

  useEffect(() => {
    if (pendingScrollOffset === null) return;
    // 카드 이동 + 페이지 페이드가 전부 통일된 duration이라, 그 시간만큼만
    // 기다리면 됨(여유분 조금 추가)
    const timer = setTimeout(() => {
      // window.scrollTo는 즉시 반영되는데, 오프셋 제거(state 변경)는 리액트의
      // 다음 렌더링까지 기다림 — 이 둘 사이에 "스크롤은 바뀌었는데 오프셋은 아직
      // 안 없어진" 짧은 순간이 그대로 화면에 그려져서, 카드가 잠깐 아래로
      // 순간이동했다 나타나는 것처럼 보이는 문제가 있었음. flushSync로 오프셋
      // 제거(및 그 결과 리렌더링/DOM 반영)를 먼저 동기적으로 완전히 끝내고, 그
      // 다음에 스크롤을 바꿔서 그 틈이 안 생기게 함.
      flushSync(() => {
        setIsScrollOffsetActive(false);
        setHasSnappedScrollOffset(true);
      });
      // 이 페이지 자신의 저장된 목표 스크롤값으로 실제 스크롤을 맞춤 (새로 들어온
      // 상세 페이지면 보통 0).
      const targetScrollY = getScrollPosition(location.pathname);
      window.scrollTo(0, targetScrollY);
    }, POST_ANIMATION_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <LoadingFade isLoading={!cardSource && isLoading}>
      {cardSource && (
        <div className="relative h-full pt-8 pb-10 text-(--paper)">
          {/* 배경색 전용 레이어. 이것도 독립적으로 페이드시켜야 함 — 안 그러면 상세 페이지가
              사라지는 동안에도 이 불투명한 배경이 화면 전체를 계속 덮고 있어서, 그 밑에서
              동시에 나타나고 있는 목록 화면이 거의 끝까지 안 보이다가 마지막 순간에야
              갑자기 드러나는 문제가 생김. 카드의 자식이 아닌 별개 형제 요소라 카드엔 영향 없음. */}
          <motion.div
            className="absolute inset-0 -z-10 bg-(--ink)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: PAGE_TRANSITION_DURATION,
              ease: "easeInOut",
            }}
          />

          <div
            className="mx-auto max-w-2xl px-6"
            style={
              isScrollOffsetActive && pendingScrollOffset !== null
                ? { marginTop: pendingScrollOffset }
                : undefined
            }
          >
            {/* 카드 위쪽 — < 티켓정보. 카드와 형제 요소라 카드의 투명도엔 영향 없음 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: PAGE_TRANSITION_DURATION,
                ease: "easeInOut",
              }}
            >
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
            </motion.div>

            {/* [캠페인 카드] — 목록 카드와 같은 layoutId로 이동 애니메이션만 독립적으로 진행.
                진짜 상세 데이터가 아직이면 넘겨받은 목록 데이터(cardSource)로 즉시 그림.
                showCardLayoutId가 꺼져있으면(새로고침으로 들어온 최초 마운트, 또는 카드
                없는 페이지로 이동 중) layoutId를 아예 안 주고, 대신 카드도 다른 요소들처럼
                페이드로 처리함. */}
            <motion.div
              className="mt-4"
              {...(showCardLayoutId
                ? {}
                : {
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -8 },
                    transition: {
                      duration: PAGE_TRANSITION_DURATION,
                      ease: "easeInOut" as const,
                    },
                  })}
            >
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
                    ? `campaign-card-${cardSource.id}`
                    : undefined
                }
                layoutDurationOverride={hasSnappedScrollOffset ? 0 : undefined}
              />
            </motion.div>

            {/* 카드 아래쪽 — 링크복사/관리 + 신청하기·취소 + 에러 문구. 역시 카드와 형제 요소.
                여긴 viewerRole/myApplication처럼 진짜 상세 데이터가 있어야만 정확히 그릴 수
                있어서, campaign(진짜 데이터)이 도착하기 전까진 간단한 대기 문구만 보여줌 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: PAGE_TRANSITION_DURATION,
                ease: "easeInOut",
              }}
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
            </motion.div>
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
