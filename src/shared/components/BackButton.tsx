import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  /** 히스토리가 없을 때(예: 새 탭에서 링크로 바로 진입) 대신 이동할 경로 */
  fallback?: string;
}

export function BackButton({ fallback = "/" }: BackButtonProps) {
  const navigate = useNavigate();

  function handleClick() {
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
