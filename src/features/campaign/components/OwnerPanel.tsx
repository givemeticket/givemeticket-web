import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, Pencil, Trash2 } from "lucide-react";
import { type CampaignDetail } from "../api/campaignApi";
import { IconButton } from "@/shared/components/IconButton";

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
  cameFrom,
}: {
  campaign: CampaignDetail;
  isActing: boolean;
  onDelete: () => void;
  onClose: () => void;
  /** 아이콘 행 맨 앞에 같이 넣을 요소 (예: 누구나 볼 수 있는 링크 복사 버튼) */
  leadingContent?: ReactNode;
  /** 지금 상세 페이지의 "어디서 왔는지" 값. 수정 페이지로 넘어갈 때 같이 실어보내서,
   * 저장 후 돌아왔을 때도 뒤로가기 버튼이 계속 보이게 함 */
  cameFrom?: string;
}) {
  const navigate = useNavigate();
  const isClosed = campaign.status === "CLOSED";

  return (
    <div className="flex items-center gap-2">
      {leadingContent}

      {!isClosed && (
        <IconButton
          onClick={() =>
            navigate(`/campaigns/${campaign.shortCode}/edit`, {
              state: { from: cameFrom },
            })
          }
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
