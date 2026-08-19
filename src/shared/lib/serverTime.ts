import { apiClient } from "./axiosClient";

interface ServerTimeResponse {
  serverTime: string;
  epochMilli: number;
}

// 클라이언트 시계와 서버 시계의 오차(ms)를 페이지당 한 번만 재고 캐싱해서 재사용.
// (여러 화면에서 동시에 호출해도 API가 중복으로 나가지 않도록 프로미스 자체를 캐싱함)
let cachedOffsetPromise: Promise<number> | null = null;

/** 왕복 시간의 절반으로 응답 시각을 보정해서 오차를 계산 (API 문서에 나온 방식 그대로) */
function measureOffset(): Promise<number> {
  const t0 = Date.now();
  return apiClient.get<ServerTimeResponse>("/api/v1/time").then((res) => {
    const t1 = Date.now();
    return res.data.epochMilli + (t1 - t0) / 2 - t1;
  });
}

/**
 * 서버-클라이언트 시계 오차(ms)를 반환. 실패하면 캐시를 비워서 다음 호출 때 재시도하고,
 * 그동안은 오차 0(로컬 시계 그대로)으로 취급하도록 에러를 던짐 — 호출부에서 catch해서 처리.
 */
export function getServerTimeOffset(): Promise<number> {
  if (!cachedOffsetPromise) {
    cachedOffsetPromise = measureOffset().catch((err) => {
      cachedOffsetPromise = null;
      throw err;
    });
  }
  return cachedOffsetPromise;
}
