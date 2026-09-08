import { useState } from "react";
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
}: {
  campaign: CampaignDetail | undefined;
  shortCode: string | undefined;
  isAuthenticated: boolean;
  navigate: NavigateFunction;
  refetch: () => Promise<unknown>;
  refetchStock: () => Promise<unknown>;
}) {
  const [actionError, setActionError] = useState("");
  const [isActing, setIsActing] = useState(false);
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

  return {
    actionError,
    // 카운트다운 만료 등 액션 핸들러 바깥에서도 이전 에러 문구를 지워야 하는
    // 경우가 있어서(CampaignDetailPage의 onCampaignOpened 참고) setter 자체를 노출함.
    setActionError,
    isActing,
    handleApply,
    handleCancel,
    handleDelete,
    handleClose,
  };
}
