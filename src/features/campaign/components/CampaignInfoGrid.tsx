import { Avatar } from "@/shared/components/Avatar";

interface CampaignInfoGridProps {
  /** 이미 포맷된 문자열로 받음 (예: "2026년 1월 20일 20:00") */
  openAtLabel: string;
  ownerNickname: string;
  ownerProfileImageUrl?: string | null;
  remainingStock?: number;
  totalStock?: number;
}

// 상세 페이지의 새 2단 레이아웃(카드 옆 오른쪽 정보 컬럼)에서 쓰는
// "오픈/주최/잔여" 라벨-값 표. CampaignCard.tsx와 마찬가지로 개별 값을
// primitive prop으로 받음 — campaign 객체 전체를 넘기지 않아도 되게 해서
// 이 컴포넌트가 CampaignDetail 타입을 몰라도 됨.
export function CampaignInfoGrid({
  openAtLabel,
  ownerNickname,
  ownerProfileImageUrl,
  remainingStock,
  totalStock,
}: CampaignInfoGridProps) {
  const hasStock =
    typeof remainingStock === "number" && typeof totalStock === "number";

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-5 gap-y-2.5 text-sm">
      <span className="text-(--muted)">오픈</span>
      <span className="text-(--paper)">{openAtLabel}</span>

      <span className="text-(--muted)">주최</span>
      <span className="flex items-center gap-1.5 text-(--paper)">
        <Avatar src={ownerProfileImageUrl} name={ownerNickname} size={16} />
        {ownerNickname}
      </span>

      <span className="text-(--muted)">잔여</span>
      {/* 카드 아래쪽 스텁(CampaignCard.tsx)과 같은 산술(totalStock -
          remainingStock)로 확정 수를 계산함 — campaign.confirmedCount도
          있지만, 신청/취소 직후 refetchStock()만 불리고 상세 재조회는
          안 되는 흐름에서 최신값이 아닐 수 있어서, 카드 스텁과 항상
          일치하는 이 계산값을 대신 씀. */}
      <span className="text-(--paper)">
        {hasStock
          ? `${remainingStock}개 남음 · ${totalStock - remainingStock} / ${totalStock}`
          : "확인 중..."}
      </span>
    </div>
  );
}
