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
  ownerId: number;
  shortCode: string;
  title: string;
  totalStock: number | null;
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
  ownerId: number;
  shortCode: string;
  title: string;
  totalStock: number | null;
  openAt: string;
  requiresPayment: boolean;
  status: CampaignStatus;
  eventAt?: string;
  location?: string;
  imageUrl?: string;
  myApplicationStatus?: ApplicationStatus;
}

/** 목록 카드에 재고까지 합쳐서 쓰기 위한 타입 */
export interface CampaignItemWithStock extends CampaignItem {
  remainingStock: number;
  soldOut: boolean;
}

export async function listCampaigns(
  scope: "owned" | "participated",
): Promise<CampaignItem[]> {
  const res = await apiClient.get<{ campaigns: CampaignItem[] }>(
    `/api/v1/campaigns?scope=${scope}`,
  );
  return res.data.campaigns;
}

/**
 * 목록 조회 + 각 캠페인의 재고를 합쳐서 반환.
 * 폴링 없이 호출 시점에 한 번만 가져옴 (새로고침해야 최신화됨).
 *
 * TODO: 캠페인이 많아지면 카드 수만큼 /stock 요청이 나가는 구조라 비효율적임.
 * 나중에 백엔드가 여러 캠페인의 재고를 한 번에 주는 배치 API를 만들면 이걸로 교체.
 */
export async function listCampaignsWithStock(
  scope: "owned" | "participated",
): Promise<CampaignItemWithStock[]> {
  const items = await listCampaigns(scope);
  const stocks = await Promise.all(
    items.map((item) => getCampaignStock(item.id)),
  );
  return items.map((item, index) => ({
    ...item,
    remainingStock: stocks[index].remainingStock,
    soldOut: stocks[index].soldOut,
  }));
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

export async function updateCampaign(
  campaignId: number,
  payload: { openAt?: string; totalStock?: number },
): Promise<void> {
  await apiClient.patch(`/api/v1/campaigns/${campaignId}`, payload);
}
