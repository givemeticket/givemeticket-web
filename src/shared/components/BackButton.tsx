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
      <ChevronLeftIcon />
    </button>
  );
}

// 기존에 이 이름으로 여러 파일에서 가져다 쓰고 있어서, lucide 아이콘을 이 이름으로
// 그대로 재수출함 — 다른 파일들을 안 건드려도 되게
export function ChevronLeftIcon() {
  return <ChevronLeft size={16} strokeWidth={2} />;
}
