import { LoadingFade } from "@/shared/components/feedback/LoadingFade";

// LoadingFade는 로딩 화면(LoadingScreen)을 내부에서 이미 createPortal로
// document.body에 직접 그리므로(LoadingFade.tsx 주석 참고 — LayoutGroup과
// layoutId 추적이 엮이지 않게 하기 위함), ConfirmDialog와 달리 이 미리보기
// 파일에서 추가로 portal을 씌울 필요가 없음 — 컴포넌트 자신이 이미 그 문제를
// 해결해 둔 상태.

// isLoading=true — 로딩 중엔 children이 아예 렌더링 안 되고(내부적으로
// {!isLoading && children}), 화면 전체를 덮는 로딩 스피너만 보임
// (CampaignApplicantsPage/CampaignListTab 등에서 데이터를 기다리는 동안의 상태).
export function Loading() {
  return (
    <LoadingFade isLoading>
      <p>이 내용은 로딩 중엔 보이지 않아요</p>
    </LoadingFade>
  );
}

// isLoading=false — 스피너 없이 children이 그대로 통과됨. CampaignApplicantsPage가
// 로딩 완료 후 보여주는 문구 패턴("{제목} · 총 {인원}명")을 그대로 재현.
export function Loaded() {
  return (
    <LoadingFade isLoading={false}>
      <div className="p-6 text-(--paper)">
        <p className="text-lg font-bold">신청자 목록</p>
        <p className="mt-1 text-sm text-(--muted)">
          2026 신년 팬미팅 - 선착순 입장 · 총 12명
        </p>
      </div>
    </LoadingFade>
  );
}
