import { apiClient } from "@/shared/lib/axiosClient";

export type CampaignStatus = "SCHEDULED" | "OPEN" | "CLOSED" | "DELETED";
export type ViewerRole = "GUEST" | "VIEWER" | "PARTICIPANT" | "OWNER";
export type ApplicationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED"
  | "UNKNOWN"
  | "MANUAL_REVIEW";
export type FailureReason =
  | "SOLD_OUT"
  | "PAYMENT_DECLINED"
  | "PAYMENT_ERROR"
  | "EXPIRED"
  | "CAMPAIGN_DELETED"
  | "USER_WITHDRAWN";

export interface CampaignOwner {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

export interface CampaignDetailPart {
  content?: string;
  eventAt?: string;
  eventEndAt?: string;
  location?: string;
  address?: string;
  imageUrl?: string;
  contact?: string;
  price?: number;
}

export interface CampaignDetail {
  id: number;
  owner: CampaignOwner;
  shortCode: string;
  title: string;
  totalStock: number | null;
  /** 상세 조회 시점의 스냅샷. 이후 최신화는 getCampaignStock으로 폴링 */
  remainingStock: number | null;
  soldOut: boolean | null;
  openAt: string;
  requiresPayment: boolean;
  status: CampaignStatus;
  viewerRole: ViewerRole;
  myApplication: {
    id: number;
    status: ApplicationStatus;
    failureReason?: FailureReason;
  } | null;
  confirmedCount: number;
  detail: CampaignDetailPart | null;
}

export interface CampaignStock {
  campaignId: number;
  remainingStock: number;
  soldOut: boolean;
}

export interface CreateCampaignRequest {
  title: string;
  totalStock?: number;
  /** ISO 8601, UTC 기준 미래 시각 */
  openAt: string;
  requiresPayment: boolean;
}

export interface CreateCampaignResponse {
  id: number;
  shortCode: string;
  title: string;
  totalStock: number | null;
  openAt: string;
  requiresPayment: boolean;
}

export interface CampaignItem {
  id: number;
  owner: CampaignOwner;
  shortCode: string;
  title: string;
  totalStock: number | null;
  /** 삭제된 행사이거나 재고를 못 읽으면 null */
  remainingStock: number | null;
  soldOut: boolean | null;
  openAt: string;
  requiresPayment: boolean;
  status: CampaignStatus;
  eventAt?: string;
  location?: string;
  imageUrl?: string;
  myApplicationStatus?: ApplicationStatus;
}

export async function listCampaigns(
  scope: "owned" | "participated",
): Promise<CampaignItem[]> {
  const res = await apiClient.get<{ campaigns: CampaignItem[] }>(
    `/api/v1/campaigns?scope=${scope}`,
  );
  return res.data.campaigns;
}

export async function createCampaign(
  payload: CreateCampaignRequest,
): Promise<CreateCampaignResponse> {
  const res = await apiClient.post<CreateCampaignResponse>(
    "/api/v1/campaigns",
    payload,
  );
  return res.data;
}

export async function getCampaign(shortCode: string): Promise<CampaignDetail> {
  const res = await apiClient.get<CampaignDetail>(
    `/api/v1/campaigns/${shortCode}`,
  );
  return res.data;
}

/** 잔여 재고/매진 여부만 따로 조회 — 상세 조회와 분리되어 자주 폴링해도 가벼움 */
export async function getCampaignStock(
  campaignId: number,
): Promise<CampaignStock> {
  const res = await apiClient.get<CampaignStock>(
    `/api/v1/campaigns/${campaignId}/stock`,
  );
  return res.data;
}

export async function deleteCampaign(campaignId: number): Promise<void> {
  await apiClient.delete(`/api/v1/campaigns/${campaignId}`);
}

/**
 * 캠페인 종료. 삭제와 달리 이미 확정된 신청은 그대로 유지되고, 취소·환불도 안 함.
 * 신규 신청만 막힘. 되돌릴 수 없고, 종료 후엔 오픈 시각도 못 바꿈(409 CAMPAIGN_CLOSED).
 */
export async function closeCampaign(campaignId: number): Promise<void> {
  await apiClient.post(`/api/v1/campaigns/${campaignId}/close`);
}

export async function updateCampaign(
  campaignId: number,
  payload: { openAt?: string; totalStock?: number },
): Promise<void> {
  await apiClient.patch(`/api/v1/campaigns/${campaignId}`, payload);
}
