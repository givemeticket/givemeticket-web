import axios from "axios";

// 백엔드가 에러 응답 바디에 실어 보내는 에러 코드(예: "SOLD_OUT",
// "ALREADY_APPLIED")를 axios 에러 객체에서 꺼내는 공통 로직. 액션 핸들러마다
// (신청/취소/삭제/종료 등) 이 코드를 보고 사용자에게 보여줄 문구를 각자 다르게
// 분기하는데, "에러 객체에서 코드를 꺼내는" 이 기계적인 부분만 여기로 뽑아서
// 중복/미묘한 변형을 방지함. 문구 분기 자체는 각 액션의 맥락에 따라 달라서
// (useCampaignActions.ts 등) 여기서 다루지 않고 호출부에 그대로 둠.
export function getApiErrorCode(e: unknown): string | undefined {
  return axios.isAxiosError(e)
    ? (e.response?.data as { code?: string })?.code
    : undefined;
}
