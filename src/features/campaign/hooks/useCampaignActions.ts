import { useState } from "react";
import { flushSync } from "react-dom";
import type { NavigateFunction } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  applyToCampaign,
  cancelApplication,
  closeCampaign,
  deleteCampaign,
  type CampaignDetail,
} from "../api/campaignApi";
import { getApiErrorCode } from "@/shared/lib/apiError";
import type { NavigationSource } from "./useShowCardLayoutId";

/**
 * 상세 페이지의 "신청/취소/삭제/종료" 액션 핸들러 + 그 진행 상태(isActing)/에러
 * 문구(actionError)를 한데 모음. CampaignDetailPage 본문에서 이 부분을 분리해서,
 * 페이지 컴포넌트는 "언제 어떤 액션을 확인창 없이/거쳐서 실행할지"만 남게 함.
 */
export function useCampaignActions({
  campaign,
  shortCode,
  isAuthenticated,
  navigate,
  refetch,
  refetchStock,
  cameFrom,
  setIsNavigatingToNonCardPage,
}: {
  campaign: CampaignDetail | undefined;
  shortCode: string | undefined;
  isAuthenticated: boolean;
  navigate: NavigateFunction;
  refetch: () => Promise<unknown>;
  refetchStock: () => Promise<unknown>;
  /** 어느 탭에서 이 상세로 들어왔는지 — 취소가 "나의 티켓" 목록에서 이 카드를
   * 빼버리는 경우에만 판단이 필요해서 받아옴(아래 handleCancel 참고). */
  cameFrom: NavigationSource | undefined;
  /** 상세 카드의 layoutId를 꺼서 이동 애니메이션 대신 페이드로 처리하게 하는
   * 스위치(useShowCardLayoutId.ts) — 원래 "수정/신청자 목록"처럼 카드 없는
   * 화면으로 떠날 때 쓰던 것을 그대로 재사용함. 삭제/취소도 결과적으로 "이
   * 카드가 돌아갈 목록에 더는 없음"이라는 점에서 같은 상황이라 이름과 달리
   * 그대로 맞아떨어짐(아래 handleDelete/handleCancel 참고).
   */
  setIsNavigatingToNonCardPage: (value: boolean) => void;
}) {
  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);
  // 신청 성공을 알리는 모달 표시 여부 — handleApply가 성공했을 때만 켜고,
  // 실제로 닫는 시점(확인 버튼/배경 클릭/Escape)은 CampaignDetailPage가 결정함.
  const [showAppliedModal, setShowAppliedModal] = useState(false);
  const queryClient = useQueryClient();

  async function handleApply() {
    if (!isAuthenticated) {
      navigate(`/?redirect=${encodeURIComponent(`/campaigns/${shortCode}`)}`);
      return;
    }
    setIsActing(true);
    setActionError("");
    try {
      const result = await applyToCampaign(campaign!.id);
      await Promise.all([refetch(), refetchStock()]);
      // 방금 refetch()한 응답이 신청 처리 직후의 읽기 지연(read-after-write
      // lag)으로 myApplication을 아직 예전 값(null)으로 돌려주는 경우가 가끔
      // 있었음 — 신청은 정상 처리됐는데 버튼이 "신청하기"로 그대로 보이다가
      // 새로고침해야만 "신청취소"로 바뀌는 버그의 원인이었음(사용자 재현
      // 확인함). applyToCampaign의 응답은 이 요청 자체에 대한 서버의 확정
      // 응답이라 100% 정확하므로, refetch 이후에 이 값으로 한 번 더 덮어써서
      // 화면이 항상 정확히 반영되도록 함.
      queryClient.setQueryData<CampaignDetail>(
        ["campaign", shortCode],
        (old) =>
          old
            ? {
                ...old,
                myApplication: { id: result.id, status: result.status },
              }
            : old,
      );
      setShowAppliedModal(true);
    } catch (e) {
      const code = getApiErrorCode(e);
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
    const applicationId = campaign!.myApplication.id;
    setIsActing(true);
    setActionError("");
    try {
      await cancelApplication(applicationId);
      await Promise.all([refetch(), refetchStock()]);
      // handleApply와 같은 이유 — refetch() 응답이 아직 예전 상태(CONFIRMED)를
      // 돌려줄 수 있어서, 취소 요청이 실제로 성공한 뒤엔(여기까지 왔다는 건
      // cancelApplication이 안 던졌다는 뜻) 확정적으로 CANCELLED로 덮어씀.
      queryClient.setQueryData<CampaignDetail>(
        ["campaign", shortCode],
        (old) =>
          old && old.myApplication
            ? {
                ...old,
                myApplication: { ...old.myApplication, status: "CANCELLED" },
              }
            : old,
      );
      // "나의 티켓" 탭에서 들어온 경우에만 취소가 이 카드를 그 목록에서
      // 빼버림(백엔드 확인함 — 내가 직접 취소한 신청은 나의 티켓 응답에서
      // 아예 제외됨). 그러면 나중에 뒤로가기로 돌아가도 목록엔 이 카드의
      // layoutId 짝이 없어서, 켜둔 채로 두면 애니메이션이 끝날 때까지
      // 방치되다 갑자기 사라지는 문제가 있었음(animation.md 3번/27번과 같은
      // 패턴). 반대로 "나의 행사"에서 들어와 내 캠페인에 내가 신청한 걸
      // 취소하는 경우엔 캠페인 자체는 그 목록에 그대로 남아있으니 layoutId를
      // 꺼선 안 됨.
      if (cameFrom === "mytickets") {
        setIsNavigatingToNonCardPage(true);
      }
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
      // 삭제는 스코프와 무관하게 이 카드를 어떤 목록에서도 없앰(목록 쪽은
      // 기본 보기에서 DELETED 상태를 아예 걸러냄 — CampaignListTab.tsx
      // 참고) — 그래서 취소와 달리 cameFrom을 따질 필요 없이 항상 꺼야 함.
      // navigate보다 먼저 이 state 변경이 실제로 반영되게 flushSync로
      // 감쌈 — 안 그러면 navigate가 먼저 처리돼버려서 이 페이지가 exit
      // 애니메이션을 시작하는 순간엔 이미 늦어버림(OwnerPanel.tsx의
      // onBeforeNavigateToNonCardPage와 같은 이유).
      flushSync(() => {
        setIsNavigatingToNonCardPage(true);
      });
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
      // 종료는 campaign.status를 CLOSED로 바꾸는데, 목록 쪽 기본 보기는
      // 스코프(나의 행사/나의 티켓)와 무관하게 CLOSED 상태를 걸러냄
      // (CampaignListTab.tsx) — 그래서 삭제와 마찬가지로 cameFrom을 따질
      // 필요 없이 항상 꺼야 함(취소와 다른 점: 취소는 "내 신청" 하나만
      // 없애서 나의 티켓 쪽에만 영향을 주지만, 종료는 캠페인 자체의 상태를
      // 바꿔서 두 목록 다 영향을 줌). 여긴 handleDelete와 달리 여기서 바로
      // navigate하지 않고 사용자가 나중에 직접 뒤로가기를 누르므로(사용자가
      // 취소 케이스에서 확인해준 것과 같은 이유) flushSync는 불필요함.
      setIsNavigatingToNonCardPage(true);
      await refetch();
    } catch {
      setActionError("종료 중 문제가 발생했어요.");
    } finally {
      setIsActing(false);
    }
  }

  return {
    actionError,
    // 카운트다운 만료 등 액션 핸들러 바깥에서도 이전 에러 문구를 지워야 하는
    // 경우가 있어서(CampaignDetailPage의 onCampaignOpened 참고) setter 자체를 노출함.
    setActionError,
    isActing,
    showAppliedModal,
    setShowAppliedModal,
    handleApply,
    handleCancel,
    handleDelete,
    handleClose,
  };
}
