import type { ReactNode } from "react";
import { BackButton } from "@/shared/components/BackButton";
import { AnimatedPageBackground } from "@/shared/animation/components/AnimatedPageBackground";

interface CampaignSubPageShellProps {
  title: string;
  backButtonFallback: string;
  backButtonForceFallback?: boolean;
  children: ReactNode;
}

// "행사 추가"/"행사 수정"/"신청자 목록" 3개 페이지가 똑같이 반복하던
// "AnimatedPageBackground + mx-auto max-w-220 컨테이너 + 뒤로가기·제목 헤더"
// 레이아웃을 하나로 모음. CampaignDetailPage는 이 셸을 안 씀 — 뒤로가기 버튼이
// cameFrom 존재 여부에 따라 조건부로 뜨고, 배경도 AnimatedPageBackground 대신
// FadeSlide를 직접 쓰는 등 구조가 의미 있게 달라서 억지로 맞추지 않음.
//
// 폭은 원래 max-w-2xl(672px, 앱 전체가 공유하던 값)이었는데, 스퀘어 카드
// 리디자인으로 UserAppShell.tsx 전역 헤더가 880px(max-w-220)로 넓어지면서
// 이 3개 페이지에서 헤더가 콘텐츠보다 넓어 보이는 어긋남이 생겨서 같이 맞춤
// (DashboardLayout.tsx/CampaignDetailPage.tsx와 동일한 값).
export function CampaignSubPageShell({
  title,
  backButtonFallback,
  backButtonForceFallback,
  children,
}: CampaignSubPageShellProps) {
  return (
    <AnimatedPageBackground>
      <div className="mx-auto max-w-220 px-6 pt-8 pb-10">
        <div className="flex items-center gap-1">
          <BackButton
            fallback={backButtonFallback}
            forceFallback={backButtonForceFallback}
          />
          <h1 className="text-lg font-bold">{title}</h1>
        </div>

        {children}
      </div>
    </AnimatedPageBackground>
  );
}
