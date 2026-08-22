// 날짜 표시/입력 변환 관련 공용 유틸.

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * 시간대 표시(Z 또는 +09:00 같은 오프셋)가 없는 문자열은 JS가 "로컬 시각"으로
 * 잘못 해석해버림. 백엔드가 UTC 값을 시간대 표시 없이 내려주는 경우를 대비해,
 * 표시가 없으면 UTC로 간주하도록 보정.
 */
function toDate(raw: string): Date {
  const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(raw);
  return new Date(hasTimezone ? raw : `${raw}Z`);
}

/** Date 객체 → <input type="datetime-local"> 형식 문자열("YYYY-MM-DDTHH:mm").
 * 아래 변환 함수들이 전부 이걸 거쳐가서, 패딩 등의 문자열 조립 로직이 한 곳에만 있음. */
function buildDatetimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO 문자열(UTC) → "8월 20일 20:00" 형태로 표시. 올해가 아니면 연도도 같이 표시 */
export function formatDateTimeKo(iso: string): string {
  const date = toDate(iso);
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("ko-KR", {
    year: isThisYear ? undefined : "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** ISO 문자열(UTC) → datetime-local 형식 문자열 */
export function isoToDatetimeLocalValue(iso: string): string {
  return buildDatetimeLocalValue(toDate(iso));
}

/** 지금 이 순간(로컬 시각) + 1분을 datetime-local 형식 문자열로 반환.
 * 정확히 "지금"을 기본값으로 주면 화면 보고 확인 누르는 사이에 과거가 될 수 있어 여유를 둠. */
export function nowAsDatetimeLocalValue(): string {
  return buildDatetimeLocalValue(new Date(Date.now() + 60_000));
}

/**
 * datetime-local 형식 문자열(로컬 시각 기준, 시간대 표시 없음)을 날짜/시/분
 * 구성요소로 분해. 비어있으면 "지금 + 1분"을 기본값으로 사용
 * (DateTimePickerField가 모달을 처음 열 때 등).
 */
export function parseDatetimeLocalValue(value: string): {
  date: Date;
  hour: number;
  minute: number;
} {
  const base = value ? new Date(value) : new Date(Date.now() + 60_000);
  return {
    date: new Date(base.getFullYear(), base.getMonth(), base.getDate()),
    hour: base.getHours(),
    minute: base.getMinutes(),
  };
}

/** 날짜(연/월/일만 사용) + 시 + 분 → datetime-local 형식 문자열 */
export function buildDatetimeLocalValueFromParts(
  date: Date,
  hour: number,
  minute: number,
): string {
  return buildDatetimeLocalValue(
    new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute),
  );
}
