import { apiClient } from "@/shared/lib/axiosClient";
import type { ApplicationStatus } from "@/features/campaign/api/campaignApi";

export interface ApplyResult {
  id: number;
  campaignId: number;
  userId: number;
  status: ApplicationStatus;
  /** 결제가 필요한 캠페인일 때만 내려옴 (PENDING 상태의 만료 시각) */
  expiresAt?: string;
}

/** 재고만 잡는 신청. 결제가 없는 캠페인이면 이 호출만으로 바로 CONFIRMED가 됨 */
export async function applyToCampaign(
  campaignId: number,
): Promise<ApplyResult> {
  const res = await apiClient.post<ApplyResult>(
    `/api/v1/campaigns/${campaignId}/apply`,
  );
  return res.data;
}

export async function cancelApplication(applicationId: number): Promise<void> {
  await apiClient.post(`/api/v1/applications/${applicationId}/cancel`);
}
