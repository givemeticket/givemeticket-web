import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SecondaryButton } from "./SecondaryButton";

interface FullPageMessageProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** 기본 true — 대부분 막다른 화면(404, 삭제됨 등)이라 나갈 길을 열어두는 게 맞음 */
  showHomeButton?: boolean;
}

// 404/삭제된 캠페인처럼 "화면 전체를 차지하는 안내 메시지" 전용. 목록 안에서
// 아담하게 쓰이는 EmptyState랑은 의도적으로 분리함 — 이쪽은 화면을 통째로
// 차지하는 만큼 훨씬 존재감 있는 크기(큰 아이콘, 큰 제목)로 다르게 가야 해서,
// EmptyState에 크기 변형 prop을 억지로 늘리는 대신 아예 별도 컴포넌트로 둠.
export function FullPageMessage({
  icon,
  title,
  description,
  showHomeButton = true,
}: FullPageMessageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-(--ink) px-6 text-center text-(--paper)">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-(--brand-blue)"
        style={{ backgroundColor: "var(--ink-soft)" }}
      >
        {icon}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xl font-bold">{title}</p>
        {description && (
          <p className="max-w-xs text-sm leading-relaxed text-(--muted)">
            {description}
          </p>
        )}
      </div>

      {showHomeButton && (
        <div className="mt-2">
          <SecondaryButton onClick={() => navigate("/")}>
            홈으로 돌아가기
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
