import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Ban, Pencil, Trash2, Users } from "lucide-react";
import { type CampaignDetail } from "../api/campaignApi";
import { IconButton } from "@/shared/components/IconButton";
import { markLeftToNonCardPage } from "@/shared/animation/pageTransition/leftToNonCardPageStore";

// 관리자(개설자) 전용 패널 — 아이콘 한 줄(수정/종료/삭제).
// 링크 복사는 역할과 무관하게 누구나 볼 수 있어야 해서 별도 CopyLinkButton으로 분리됨.
// "수정"은 예전엔 여기 인라인 폼이 펼쳐지는 방식이었는데, "행사 추가"랑 동일하게
// 별도 페이지(CampaignEditPage)로 이동하는 방식으로 바꿈. 참여(신청/취소) 관련 UI는
// 여기 없음 — 상세 페이지의 공통 "신청하기/신청취소" 섹션이 역할과 무관하게 처리함.
export function OwnerPanel({
  campaign,
  isActing,
  onDelete,
  onClose,
  leadingContent,
  onBeforeNavigateToNonCardPage,
}: {
  campaign: CampaignDetail;
  isActing: boolean;
  onDelete: () => void;
  onClose: () => void;
  /** 아이콘 행 맨 앞에 같이 넣을 요소 (예: 누구나 볼 수 있는 링크 복사 버튼) */
  leadingContent?: ReactNode;
  /** "수정"/"신청자 목록"처럼, 캠페인 카드 자체가 없는 페이지로 이동하기 직전에
   * 호출됨. 상세 페이지가 이걸로 카드를 페이드아웃 처리함(opacity만 조절 —
   * layoutId 자체는 안 건드림, CampaignDetailPage.tsx 참고).
   *
   * flushSync 제거를 실험해봤는데, 오히려 깜빡임이 더 길어지는 부작용이
   * 있어서(실제로 확인함) 다시 되돌림 — 왜 flushSync 없이 자동 배칭에만
   * 맡기면 더 나빠지는지는 아직 정확히 모름(추측: navigate로 인한 리액트
   * 라우터 자체의 리렌더까지 한 커밋에 다 같이 묶이면서, 그 큰 커밋 자체가
   * 오히려 더 늦게/뭉쳐서 처리되는 것으로 추정 — 확인 안 됨). */
  onBeforeNavigateToNonCardPage?: () => void;
}) {
  const navigate = useNavigate();
  const isClosed = campaign.status === "CLOSED";

  return (
    <div className="flex items-center gap-2">
      {leadingContent}

      <IconButton
        onClick={() => {
          flushSync(() => {
            onBeforeNavigateToNonCardPage?.();
          });
          markLeftToNonCardPage(campaign.shortCode);
          // 상세 페이지에서 클릭해서 들어왔다는 걸 표시 — 신청자 목록/수정
          // 페이지가 이 값으로(CampaignDetailPage의 cameFrom과 같은 원칙)
          // 뒤로가기 버튼을 보여줄지 판단함. 공유되는 화면이 아니라 항상
          // 이 경로로만 들어오지만, 주소를 직접 입력했거나 북마크로 들어온
          // 경우엔 이 값이 없어서 뒤로가기 버튼이 안 보임 — 그런 경우
          // "뒤로"가 이 캠페인의 상세 페이지라는 보장이 없어서.
          navigate(`/campaigns/${campaign.shortCode}/applicants`, {
            state: { fromDetail: true },
          });
        }}
        label="신청자 목록"
      >
        <Users size={17} strokeWidth={1.7} />
      </IconButton>

      {!isClosed && (
        <IconButton
          onClick={() => {
            flushSync(() => {
              onBeforeNavigateToNonCardPage?.();
            });
            markLeftToNonCardPage(campaign.shortCode);
            // 이유는 위 "신청자 목록" 버튼과 동일
            navigate(`/campaigns/${campaign.shortCode}/edit`, {
              state: { fromDetail: true },
            });
          }}
          label="수정"
        >
          <Pencil size={17} strokeWidth={1.7} />
        </IconButton>
      )}

      {!isClosed && (
        <IconButton onClick={onClose} label="종료" disabled={isActing}>
          <Ban size={17} strokeWidth={1.7} />
        </IconButton>
      )}

      <IconButton
        onClick={onDelete}
        label="삭제"
        disabled={isActing}
        tone="warn"
      >
        <Trash2 size={17} strokeWidth={1.7} />
      </IconButton>
    </div>
  );
}
