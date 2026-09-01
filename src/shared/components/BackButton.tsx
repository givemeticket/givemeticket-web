import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  /** 히스토리가 없을 때(예: 새 탭에서 링크로 바로 진입) 대신 이동할 경로 */
  fallback?: string;
  /** navigate() 호출 직전에 동기적으로 실행됨. 여러 화면이 공유하는 컴포넌트라
   * 뭘로 이동하는지 여기선 알 수 없는데, 특정 화면(예: 상세→목록)에서만 필요한
   * 사전 처리(스크롤 오프셋 표시 등)를 이걸로 끼워넣을 수 있게 함 */
  onBeforeNavigate?: () => void;
}

export function BackButton({
  fallback = "/",
  onBeforeNavigate,
}: BackButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
    onBeforeNavigate?.();
    if (window.history.length > 1) {
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
      className="rounded-full py-1 pr-1 pl-0 text-(--paper)"
    >
      <ChevronLeft size={16} strokeWidth={2} />
    </button>
  );
}
