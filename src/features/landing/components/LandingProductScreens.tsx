import { LANDING_PRODUCT_SCREENS } from "../lib/landingContent";

interface LandingProductScreensProps {
  /** state0(히어로)을 제외한 5개 화면의 opacity — LandingScrollState.screenOpacity[1..5] */
  opacities: number[];
}

// 카드 안에서 히어로 다음으로 순서대로 크로스페이드되는 제품 화면 5개.
// 실제 캡처(정지 이미지 또는 나중에 스크롤 스크러빙용 영상)가 아직 없어서,
// 지금은 campaign-image-placeholder(index.css)와 같은 대각선 줄무늬
// 자리표시로 채움 — 나중에 각 슬롯의 자리표시 div를 <img>/<video>로만
// 바꾸면 되도록 구조를 슬롯 단위로 분리해둠.
export function LandingProductScreens({
  opacities,
}: LandingProductScreensProps) {
  return (
    <>
      {LANDING_PRODUCT_SCREENS.map((screen, i) => (
        <div
          key={screen.id}
          className="absolute inset-0"
          style={{
            opacity: opacities[i] ?? 0,
            visibility: (opacities[i] ?? 0) > 0.005 ? "visible" : "hidden",
          }}
        >
          <div className="campaign-image-placeholder flex h-full w-full items-center justify-center">
            <p className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-medium text-(--muted)">
              {screen.label} 스크린샷 (준비 중)
            </p>
          </div>
        </div>
      ))}
    </>
  );
}
