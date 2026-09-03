import { useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import axios from "axios";
import {
  applyToCampaign,
  cancelApplication,
  closeCampaign,
  deleteCampaign,
  type CampaignDetail,
} from "../api/campaignApi";

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
