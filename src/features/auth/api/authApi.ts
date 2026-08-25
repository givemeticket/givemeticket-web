import { apiClient } from "@/shared/lib/axiosClient";
import type { OAuthProvider } from "../lib/oauthUrls";

interface TokenResponse {
  token: string;
}

export interface MeResponse {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  withdrawn: boolean;
}

/**
 * 인가 코드를 백엔드로 넘기면 그 자리에서 로그인/가입까지 끝나고 액세스 토큰이 나옴.
 * 처음 온 계정이면 이 호출에서 가입도 같이 처리됨 (닉네임/프로필은 제공자 값 그대로 사용).
 */
export async function exchangeAuthCode(params: {
  code: string;
  provider: OAuthProvider;
  redirectUrl: string;
  state?: string;
}): Promise<string> {
  const res = await apiClient.post<TokenResponse>("/api/v1/code", params);
  return res.data.token;
}

/** 지금 로그인된 내 정보(닉네임/프로필사진). 토큰을 직접 디코딩하지 않고
 * 이 API로 내 userId/닉네임/프로필을 알아냄 */
export async function getMe(): Promise<MeResponse> {
  const res = await apiClient.get<MeResponse>("/api/v1/users/me");
  return res.data;
}

/** 회원탈퇴. 현재 로그인된 유저(토큰 소유자) 본인을 삭제함 */
export async function withdrawUser(): Promise<void> {
  await apiClient.delete("/api/v1/users/me");
}
