// 날짜 표시/입력 변환 관련 공용 유틸.

/**
 * 시간대 표시(Z 또는 +09:00 같은 오프셋)가 없는 문자열은 JS가 "로컬 시각"으로
 * 잘못 해석해버림. 백엔드가 UTC 값을 시간대 표시 없이 내려주는 경우를 대비해,
 * 표시가 없으면 UTC로 간주하도록 보정.
 */
function toDate(raw: string): Date {
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(raw);
  return new Date(hasTimezone ? raw : `${raw}Z`);
}

/** ISO 문자열 → "8월 20일 20:00" 형태로 표시. 올해가 아니면 연도도 같이 표시 */
export function formatDateTimeKo(iso: string): string {
  const date = toDate(iso);
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  const formatted = new Intl.DateTimeFormat("ko-KR", {
    year: isThisYear ? undefined : "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return formatted;
}

/** ISO 문자열 → <input type="datetime-local"> 이 요구하는 "YYYY-MM-DDTHH:mm" 형태 */
export function isoToDatetimeLocalValue(iso: string): string {
  const date = toDate(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 지금 이 순간(로컬 시각)을 "YYYY-MM-DDTHH:mm" 형태로 반환 */
export function nowAsDatetimeLocalValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
