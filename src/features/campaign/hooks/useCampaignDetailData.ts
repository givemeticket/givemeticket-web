import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCampaign,
  getCampaignStock,
  type CampaignItem,
} from "../api/campaignApi";
import { markTransitioningCampaign } from "../lib/transitioningCampaignStore";

/**
 * 캠페인 상세 페이지가 필요로 하는 데이터를 여러 소스(진짜 상세 API, 목록에서
 * 넘겨받은 placeholder, 별도 재고 API)에서 조립해서 하나로 정리해줌.
 * CampaignDetailPage 본문에서 이 부분을 분리해서, 페이지 컴포넌트는 "조립된
 * 데이터를 화면에 배치하는 일"에만 집중할 수 있게 함.
 */
export function useCampaignDetailData(
  shortCode: string | undefined,
  placeholderCampaign?: CampaignItem,
) {
  const {
    data: campaign,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaign", shortCode],
    queryFn: () => getCampaign(shortCode!),
    enabled: Boolean(shortCode),
  });

  // 카드를 그리는 데 필요한 정보는 진짜 상세 데이터든, 넘겨받은 목록 데이터든 형태가
  // 거의 같아서(title/status/openAt/owner/totalStock 등) 뭐가 있든 그걸로 카드를 그림.
  // 카드에 필요한 정보는 목록이든 상세든 같은 값이라 실시간으로 최신화할 필요가 없음.
  // 오히려 애니메이션이 진행되는 도중 진짜 데이터가 도착해서 카드의 props가 바뀌면,
  // layoutId가 있는 요소는 그 순간 다시 위치를 측정하면서 이동 애니메이션이 중간에
  // 순간이동하는 문제가 생김. 그래서 넘겨받은 데이터가 있으면(=목록에서 들어온 경우)
  // 계속 그걸 우선하고, 없을 때만(=공유 링크로 직접 들어온 경우) 진짜 데이터를 씀.
  const cardSource = placeholderCampaign ?? campaign ?? null;

  // 지금 보고 있는 캠페인 id를 기록해둠. 뒤로가기로 목록에 돌아가면, 목록이 이 값을
  // 읽어서 "얘가 방금 여기서 돌아온 카드구나"를 판단해 개별 페이드를 안 줌
  useEffect(() => {
    if (cardSource) markTransitioningCampaign(cardSource.id);
  }, [cardSource]);

  // 재고는 상세 정보와 분리된 별도 API. 새로고침(=이 페이지 재진입) 시에만 조회하고
  // 자동 폴링은 하지 않음 — 실시간 자동 갱신은 필요 없다고 확인됨.
  // 신청/취소/정원수정처럼 사용자가 직접 액션을 했을 때는 그 직후 refetchStock()로 갱신.
  const { data: stock, refetch: refetchStock } = useQuery({
    queryKey: ["campaignStock", cardSource?.id],
    queryFn: () => getCampaignStock(cardSource!.id),
    enabled: Boolean(cardSource?.id),
  });

  // 상세 조회 응답(또는 그게 없으면 넘겨받은 목록 데이터)에 실린 재고는 "스냅샷".
  // stock 쿼리가 아직 안 끝났으면 이 스냅샷을 폴백으로 써서 빈 화면이 덜 보이게 함.
  const remainingStock =
    stock?.remainingStock ?? cardSource?.remainingStock ?? undefined;
  const soldOut = stock?.soldOut ?? cardSource?.soldOut ?? false;
  const hasStockValue =
    stock !== undefined || cardSource?.remainingStock !== null;

  // myApplication은 값이 있다고 해서 "아직 신청 중"이라는 뜻이 아님 — 취소한
  // 신청도 status만 CANCELLED로 바뀐 채로 계속 내려오기 때문에 따로 확인해야 함
  const hasActiveApplication =
    campaign?.myApplication != null &&
    campaign.myApplication.status !== "CANCELLED";

  return {
    campaign,
    cardSource,
    isLoading,
    isError,
    error,
    refetch,
    stock,
    refetchStock,
    remainingStock,
    soldOut,
    hasStockValue,
    hasActiveApplication,
  };
}
