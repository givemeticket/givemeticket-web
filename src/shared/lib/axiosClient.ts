import axios from "axios";
import { clearAccessToken, getAccessToken } from "./authToken";

// 백엔드가 Bearer 토큰(JWT) 인증으로 확정되어, 쿠키 기반이 아니므로
// withCredentials는 필요 없음. 요청마다 저장된 액세스 토큰을 자동으로 실어 보냄.
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      getAccessToken()
    ) {
      // 저장된 토큰이 있는데도 401이 왔다는 건 토큰이 만료/위조됐다는 뜻.
      // 지우고 새로고침해서 로그인 화면으로 보냄 — navigate() 대신 하드
      // 리로드를 쓰는 이유는 useLogout.ts와 동일(전환 애니메이션 중
      // ProtectedRoute가 리렌더되며 잘못된 리다이렉트를 만드는 레이스
      // 컨디션을 피하기 위함). 토큰 자체가 없는 상태(비로그인 사용자가
      // 정상적으로 401을 받는 경우)는 여기서 건드리지 않음.
      clearAccessToken();
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);
