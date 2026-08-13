import { useNavigate } from "react-router-dom";

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
      className="rounded-full p-1 text-(--paper)"
    >
      <ChevronLeftIcon />
    </button>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg
      width="10"
      height="16"
      viewBox="0 0 8 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 1L1 7L7 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
