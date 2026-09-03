import { type CampaignDetail } from "../api/campaignApi";
import { SecondaryButton } from "@/shared/components/buttons/SecondaryButton";
import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";
import { CountdownApplyButton } from "./CountdownApplyButton";

export function ApplySection({
  campaign,
  hasStockValue,
  isActing,
  onApply,
  onCampaignOpened,
}: {
  campaign: CampaignDetail;
  hasStockValue: boolean;
  isActing: boolean;
  onApply: () => void;
  onCampaignOpened: () => void;
}) {
  if (campaign.status === "SCHEDULED") {
    return (
      <CountdownApplyButton
        openAt={campaign.openAt}
        isActing={isActing}
        onClick={onApply}
        onExpire={onCampaignOpened}
      />
    );
  }
  if (campaign.status === "CLOSED" || campaign.status === "DELETED") {
    return <SecondaryButton disabled>종료된 행사예요</SecondaryButton>;
  }
  if (!hasStockValue) {
    return <SecondaryButton disabled>재고 확인 중...</SecondaryButton>;
  }
  // 매진 표시가 있어도 신청 버튼 자체는 막지 않음 — 취소표가 나올 수 있어서.
  // 실제로 여전히 매진이면 handleApply의 catch에서 SOLD_OUT 에러로 안내됨
  return (
    <PrimaryButton onClick={onApply} disabled={isActing}>
      {isActing ? "처리 중..." : "신청하기"}
    </PrimaryButton>
  );
}
