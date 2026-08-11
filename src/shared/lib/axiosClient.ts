import axios from "axios";
import { getAccessToken } from "./authToken";

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

// 공통 에러 처리 자리.
// TODO: 토큰 만료(401) 시 로그인 화면으로 보내는 처리 등, 필요해지면 여기에 추가
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);
