import { useEffect, useRef, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { BrandLogo } from "@/shared/components/BrandLogo";

// BrandLogo는 useNavigate()를 쓰기 때문에 Router 컨텍스트가 필요함 - BackButton
// 미리보기와 같은 이유로 MemoryRouter로 감싸줌.
//
// props가 전혀 없는 완전히 정적인 컴포넌트라 값으로는 변주가 안 생김 - 그래서
// "단독 vs 실제 헤더 안에서" 두 가지 맥락으로 나눔.

// BrandLogo는 실제 앱에서 public/favicon-transparent-512.png를 절대경로("/")로
// 불러오는데, 이 미리보기는 앱의 정적 파일 서버가 아니라 design-sync 자체 번들
// 서버 위에서 렌더링되기 때문에 그 경로가 404가 나서 깨진 이미지 아이콘으로
// 보임(BrandLogo 컴포넌트 자체나 실제 앱에서는 전혀 문제 없음 - 순전히 이
// 미리보기 서버만의 문제. Modal.tsx 미리보기의 createPortal 우회와 같은 종류의
// 조치). 마운트 후 그 <img>를 찾아서 같은 로고 원본 파일(public/favicon.png)을
// base64로 인라인한 데이터 URI로 src만 바꿔치기함 - BrandLogo 컴포넌트 자체의
// 코드/사용법은 전혀 건드리지 않음.
const REAL_LOGO_DATA_URI =
  "data:image/png;base64,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";

function WithLogoAssetFixed({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const img = containerRef.current?.querySelector<HTMLImageElement>(
      'img[src="/favicon-transparent-512.png"]',
    );
    if (img) img.src = REAL_LOGO_DATA_URI;
  }, []);
  return <div ref={containerRef}>{children}</div>;
}

// 단독 렌더링 - 로고 아이콘 + 두 줄로 쌓은 "GIVEME/TICKET" 텍스트.
export function Default() {
  return (
    <MemoryRouter>
      <WithLogoAssetFixed>
        <BrandLogo />
      </WithLogoAssetFixed>
    </MemoryRouter>
  );
}

// UserAppShell의 실제 헤더 바 안에서 - sticky 헤더의 배경/패딩/점선 구분선을
// 그대로 재현. 좁은 화면에서 탭·아바타와 자리다툼을 피하려고 텍스트를 두
// 줄로 쌓은 이유(BrandLogo.tsx 주석 참고)가 이 맥락에서 드러남.
export function InHeaderBar() {
  return (
    <MemoryRouter>
      <WithLogoAssetFixed>
        <header className="w-full max-w-2xl bg-(--ink) px-6 pt-8">
          <div className="flex items-center gap-4 border-b-2 border-dashed border-[rgba(17,24,39,0.16)] pb-8">
            <BrandLogo />
          </div>
        </header>
      </WithLogoAssetFixed>
    </MemoryRouter>
  );
}
