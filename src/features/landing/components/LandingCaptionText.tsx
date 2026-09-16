import type { LandingCaption } from "../lib/landingContent";

// 캡션 하나(eyebrow+title+body)의 실제 마크업. 6개 캡션 전부 eyebrow 1줄 +
// 제목 1줄 + 본문 1줄 구조로 고정함(둘 다 whitespace-nowrap) — 그래야
// 6개의 실제 렌더링 높이가 전부 똑같아져서, LandingCaptions.tsx가 그중
// "아무거나 하나"만 재도 캡션+카드 배치 계산에 그대로 쓸 수 있음(내용이
// 다른데도 높이가 같다는 전제가 깨지면, 그 전제로 계산하는 배치도 같이
// 어긋남).
export function LandingCaptionText({ caption }: { caption: LandingCaption }) {
  return (
    <>
      <p
        className="whitespace-nowrap font-['Archivo'] text-[11px] font-bold text-(--brand-yellow)"
        style={{ letterSpacing: "0.3em" }}
      >
        {caption.eyebrow}
      </p>
      <h2 className="mt-2.5 whitespace-nowrap font-['Gothic_A1'] text-[clamp(20px,2.4vw,32px)] font-black text-white">
        {caption.title}
      </h2>
      <p className="mt-2.5 whitespace-nowrap text-[clamp(13px,1.1vw,15px)] leading-relaxed text-white/84">
        {caption.body}
      </p>
    </>
  );
}
