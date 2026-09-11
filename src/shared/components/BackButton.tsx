import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  /** 히스토리가 없을 때(예: 새 탭에서 링크로 바로 진입), 또는 forceFallback이
   * true일 때 대신 이동할 경로 */
  fallback?: string;
  /** navigate() 호출 직전에 동기적으로 실행됨. 여러 화면이 공유하는 컴포넌트라
   * 뭘로 이동하는지 여기선 알 수 없는데, 특정 화면(예: 상세→목록)에서만 필요한
   * 사전 처리(스크롤 오프셋 표시 등)를 이걸로 끼워넣을 수 있게 함 */
  onBeforeNavigate?: () => void;
  /** true면 history.length와 무관하게 항상 fallback으로 이동함. 기본
   * history.length 기반 판단은 "이전 히스토리 항목이 이 화면과 실제로 관련
   * 있는지"까지는 보장 못 함 — 예를 들어 이 화면 URL을 주소창에 직접
   * 입력해서 들어온 경우, 같은 탭에 다른 사이트 방문 기록이 남아있으면
   * history.length가 1보다 커서 navigate(-1)이 실행되는데, 그러면 이 화면과
   * 전혀 무관한 엉뚱한 이전 페이지(새 탭의 이전 방문 기록 등)로 가버림. 호출하는
   * 쪽이 "진짜 이 화면으로 이어지는 경로로 들어왔는지" 알고 있을 때만 이 값을
   * false(기본값)로 둬서 history.length 기반 판단을 쓰고, 모를 땐 true로 넘겨서
   * 무조건 fallback(이 화면이 속한 진짜 상위 화면)으로 보내야 함. */
  forceFallback?: boolean;
}

export function BackButton({
  fallback = "/",
  onBeforeNavigate,
  forceFallback = false,
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
    onBeforeNavigate?.();
    if (!forceFallback && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="뒤로가기"
      // 실제 히트 영역을 IconButton과 같은 44px로 키우되(p-3.5 = 14px, 16px
      // 아이콘 + 양옆 14px = 44px), 이 버튼은 항상 오른쪽에 제목 텍스트가
      // 바로 붙어서 쓰이므로(flex gap-1) 레이아웃에 그대로 반영하면 아이콘과
      // 텍스트 사이가 14px씩 더 멀어짐 — 그래서 상/하/좌는 패딩만큼 그대로
      // 음수 마진(-m-3.5)으로 당겨서 상쇄하고, 오른쪽만 원래 간격이던
      // pr-1(4px)이 그대로 남도록 덜 당김(-mr-2.5 = -(14-4)px). 이렇게 하면
      // 터치 영역은 진짜로 44px지만, 다른 요소 입장에서 이 버튼이 차지하는
      // 눈에 보이는 자리는 예전(pl-0 pr-1)과 완전히 동일하게 유지됨
      // (Tooltip.tsx/CampaignFormFields.tsx의 "패딩 + 상쇄 음수 마진"과 같은
      // 패턴, 다만 여긴 오른쪽만 의도적으로 덜 상쇄함).
      className="-mt-3.5 -mb-3.5 -ml-3.5 -mr-2.5 rounded-full p-3.5 text-(--paper)"
    >
      <ChevronLeft size={16} strokeWidth={2} />
    </button>
  );
}
