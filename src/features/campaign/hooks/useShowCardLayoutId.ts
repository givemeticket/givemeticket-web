import { useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { consumeLeftToNonCardPage } from "@/shared/animation/pageTransition/leftToNonCardPageStore";
import { isInitialDetailPageMount } from "@/shared/animation/pageTransition/initialDetailMountStore";

/** 어디서 이 페이지로 들어왔는지 — 대시보드 탭에서 카드 클릭 시에만 명시적으로 실어서 넘김.
 * 공유 링크로 직접 들어오거나 주소를 직접 입력한 경우엔 이 값이 없어서 뒤로가기 버튼이 안 보임. */
export type NavigationSource = "mycampaigns" | "mytickets";

// CampaignDetailPage가 카드에 layoutId(목록 카드와의 공유 레이아웃 이동 애니메이션)를
// 켤지 말지를 판단하는 로직만 모음. cameFrom/navigationType/cameFromNonCardPage/
// isRefreshMount/isNavigatingToNonCardPage가 전부 이 판단 하나에만 쓰여서 페이지
// 컴포넌트에서 통째로 분리함.
export function useShowCardLayoutId(shortCode: string | undefined) {
  const location = useLocation();

  // 마운트되는 순간 딱 한 번만 값을 붙잡아둠(useState의 lazy initializer). location은
  // 전역 값이라, 뒤로가기를 누르면 이 컴포넌트가 아직 exit 애니메이션 재생 중(=화면에
  // 남아있는 상태)이어도 라우터가 이미 바뀐 새 경로/state를 그대로 반영해버림 — 그러면
  // cameFrom이 순간 undefined가 되면서, 페이지 전체가 사라지기도 전에 뒤로가기 버튼만
  // 먼저 사라지는 문제가 있었음. 한 번 캡처해두면 이후 라우터가 어떻게 바뀌든 무관해짐.
  const [cameFrom] = useState(
    () => (location.state as { from?: NavigationSource } | null)?.from,
  );

  // cameFrom과 같은 이유로 마운트 시점에 한 번만 고정 — layoutId를 쓸지는 마운트
  // 시점에 한 번 결정하고 인스턴스가 살아있는 동안 절대 바꾸면 안 됨. 얼려두지
  // 않으면, 이 페이지가 아직 exit 애니메이션 중일 때 라우터의 navigationType이
  // 이미 다음 값으로 바뀌어버려서 이 원칙이 깨짐.
  const rawNavigationType = useNavigationType();
  const [navigationType] = useState(() => rawNavigationType);
  // 카드 없는 화면(수정/신청자 목록)에서 막 돌아온 경우 — 이것도 이 인스턴스가
  // 살아있는 내내 영구 고정임. navigationType만으론 이 경우를 구분할 수 없어서
  // (아래 showCardLayoutId 주석 참고) 별도로 필요함.
  const [cameFromNonCardPage] = useState(() =>
    consumeLeftToNonCardPage(shortCode ?? ""),
  );
  // 이 세션이 새로고침(또는 공유 링크)으로 이 상세 페이지에 바로 들어온
  // 경우 — 이것도 이 인스턴스가 살아있는 내내 영구 고정임. cameFrom/navigationType
  // 만으론 이 경우를 구분할 수 없어서(아래 showCardLayoutId 주석 참고) 별도로
  // 필요함.
  const [isRefreshMount] = useState(() => isInitialDetailPageMount());
  // "수정"/"신청자 목록"처럼 캠페인 카드 자체가 없는 페이지로 이동하려는 참이면 true.
  // OwnerPanel이 그 버튼을 누르는 순간(navigate 직전) 동기적으로 이 값을 켜줌.
  const [isNavigatingToNonCardPage, setIsNavigatingToNonCardPage] =
    useState(false);
  // 목록 카드는 항상(예외 없이) layoutId를 갖고 있음(CampaignListTab.tsx 참고) —
  // 그래서 상세 쪽이 layoutId를 켤지 말지는 "지금 목록에 정말 그 짝이 있는지"를
  // 최대한 정확히 추정해야 함. 처음엔 "목록 클릭(PUSH)으로 들어왔는지"만 보면
  // 될 줄 알았는데, 실제로 확인해보니 그것만으론 부족함:
  // - navigationType === "PUSH": navigate()로 만든 새 히스토리 항목에서만 성립.
  //   진짜 새 클릭 진입은 항상 이걸 만족함.
  // - 문제는 POP(뒤로/앞으로가기)을 전부 뭉뚱그려 끄면 안 된다는 것 — "목록 클릭
  //   으로 만들어진 항목에 브라우저 *앞으로가기*로 재진입"하는 경우도 POP인데,
  //   이땐 목록 카드가 여전히 layoutId를 갖고 있어서 상세도 맞춰서 켜야 함. 안
  //   그러면 목록 카드가 상대를 못 찾고 방치되다가, 그 화면 다른 요소들 페이드가
  //   끝나야 사라지면서 상세 페이지가 늦게 "갑자기" 나타나는 것처럼 보임
  //   (animation.md 3번과 같은 종류 — 실제로 겪은 버그. cameFromNonCardPage
  //   없이 navigationType만 썼다가 재현됨).
  // - 반대로 "카드 없는 화면에서 뒤로가기로 돌아옴"도 POP이지만, 이땐 짝(그
  //   화면엔 카드가 없었음)이 없으니 꺼야 함.
  // - 그런데 "이 상세 페이지 자체에서 새로고침"도 POP으로 보고되고, cameFrom도
  //   (location.state가 새로고침에도 살아남아서) 그대로 true로 남아있음 — 즉
  //   "새로고침"과 "브라우저 앞으로가기로 재진입"이 navigationType+cameFrom+
  //   cameFromNonCardPage만으로는 구분이 안 됨(실제로 겪은 버그 — 새로고침
  //   후 뒤로가기 시 카드가 짝 없이 layoutId로 이동하려다 엉뚱한 곳으로
  //   사라짐). isRefreshMount로 이 경우만 따로 걸러냄.
  // 결국 POP 중에서도 "카드 없는 화면에서 왔는지"만 따로 구분해야 해서
  // cameFromNonCardPage가 필요함 — PUSH면 무조건 켜고, POP이면 "카드 없는
  // 화면에서 온 게 아닐 때만" 켬. 새로고침이면 그 무엇과도 무관하게 항상 끔.
  //
  // isNavigatingToNonCardPage도 여기 넣음 — "수정"/"신청자 목록"으로 떠나려는
  // 참이면 그 즉시 layoutId를 끔. 마운트 이후 동적으로 껐다 켜는 거라 원칙
  // (animation.md 1번)엔 안 맞고 카드가 순간 살짝 흐려졌다 풀렸다 다시
  // 페이드되는 미세한 깜빡임이 있는데(opacity만 따로 조절하는 방식으로
  // 없애보려 했었으나, 실제로는 안 없어지고 오히려 "카드 없는 화면을 한 번이라도
  // 거친 뒤 목록으로 돌아갈 때 이동 애니메이션이 아예 없어지는" 더 큰 부작용만
  // 생겨서 이 방식으로 되돌림) — 사용자가 감수하기로 함. TODO.md 참고.
  const showCardLayoutId =
    !isRefreshMount &&
    cameFrom !== undefined &&
    (navigationType === "PUSH" || !cameFromNonCardPage) &&
    !isNavigatingToNonCardPage;

  return { cameFrom, showCardLayoutId, setIsNavigatingToNonCardPage };
}
