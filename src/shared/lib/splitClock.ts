// "시:분:초를 두 자리 문자열로 쪼개기" 헬퍼(지금은 useServerClock.ts가 씀).
// 원래 HeaderLiveClock.tsx 안에 있었는데, 컴포넌트 파일에서 컴포넌트가 아닌
// 함수를 export하면 Fast Refresh가 깨져서(react-refresh/only-export-components)
// 별도 파일로 뺐음.
export function splitClock(epochMs: number): {
  hh: string;
  mm: string;
  ss: string;
} {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    hh: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
}
