import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getApplication,
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
  // 진짜 데이터(campaign)를 우선하고, 아직 로딩 중일 때만(=상세 API 응답 도착 전) 넘겨받은
  // 데이터로 임시로 채움. 한때는 반대로(넘겨받은 데이터를 계속 우선) 했었는데, 그러면
  // 수정/신청 등으로 실제 값이 바뀌어도 화면에 영원히 반영이 안 되는 문제가 있었음
  // (수정해도 카드에 안 뜨고, 새로고침해도 안 뜨고, 뒤로갔다 재진입해야만 뜨는 버그 —
  // location.state는 새로고침해도 브라우저 히스토리에 남아있어서였음). 그 반대 우선순위는
  // "애니메이션 도중 데이터가 바뀌면 이동 애니메이션이 꼬인다"는 문제 때문이었는데, 그건
  // 이후 다른 근본 원인들(CSS transform 충돌, layoutId 항상 부여 등)을 고치면서 이미
  // 해결된 상태라 이 우회로 자체가 불필요해짐.
  const cardSource = campaign ?? placeholderCampaign ?? null;

  // imageUrl은 CampaignItem(목록 데이터)이면 최상위에, CampaignDetail(진짜 상세 데이터)이면
  // detail.imageUrl 안에 있어서 위치가 서로 다름. 카드에 넘길 때 어느 쪽이든 통일해서 씀
  const cardImageUrl =
    cardSource && "detail" in cardSource
      ? cardSource.detail?.imageUrl
      : cardSource?.imageUrl;

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

  // 신청 시각(createdAt)은 상세 조회 응답에 안 실려있어서, 신청 건 자체를 별도로
  // 한 번 더 조회해야 함. 활성 신청이 있을 때만 조회함.
  const { data: myApplicationDetail } = useQuery({
    queryKey: ["application", campaign?.myApplication?.id],
    queryFn: () => getApplication(campaign!.myApplication!.id),
    enabled: hasActiveApplication,
  });

  return {
    campaign,
    cardSource,
    cardImageUrl,
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
    myApplicationDetail,
  };
}
