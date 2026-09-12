import { useState, type SubmitEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createCampaign } from "../api/campaignApi";
import { CampaignFormFields } from "../components/CampaignFormFields";
import { CampaignSubPageShell } from "../components/CampaignSubPageShell";
import { nowAsDatetimeLocalValue } from "@/shared/lib/formatDate";
import { PrimaryButton } from "@/shared/components/buttons/PrimaryButton";
import { useScrollOffsetSnap } from "@/shared/animation/pageTransition/useScrollOffsetSnap";
import { getScrollPosition } from "@/shared/animation/pageTransition/scrollPositionStore";

export function CampaignCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // "나의 행사" 목록을 스크롤을 내린 채로 이 화면으로 넘어오거나 돌아갈 때
  // 스크롤이 갑자기 튀어 보이던 문제 수정 — CampaignDetailPage.tsx와 완전히
  // 같은 메커니즘(useScrollOffsetSnap.ts, routeTransitionRules.ts의
  // supportsScrollOffsetTrick에 이 경로가 추가됨)을 그대로 재사용함. 목록↔상세
  // 전환과 마찬가지로, 전환 애니메이션 내내 실제 브라우저 스크롤은 목록의 값에
  // 그대로 고정해두고, 이 페이지 콘텐츠에만 그만큼 margin-top을 걸어 "이미 맨
  // 위로 스크롤된 것처럼" 보이게 함 — 그래서 RootLayout이 즉시 호출하던
  // window.scrollTo(0, 0)이나, 뒤로 갈 때 애니메이션 후 지연 호출되던
  // window.scrollTo(0, 저장값) 자체가 아예 필요 없어져서 눈에 보이는 점프가
  // 없어짐.
  const { pendingScrollOffset, isScrollOffsetActive } = useScrollOffsetSnap(
    () => getScrollPosition(location.pathname),
  );
  // 아래 스페이서와 마찬가지로 CampaignDetailPage.tsx와 동일한 이유 —
  // 문서 전체 스크롤 가능 높이가 오프셋+뷰포트보다 짧아지면(이 폼처럼 짧은
  // 페이지에서는 원본 문서보다 더 쉽게 발생함) 브라우저가 스크롤을 강제로
  // 잘라내는 문제가 있어서, 최소 높이를 스페이서로 보장함.
  const [viewportHeightAtMount] = useState(() => window.innerHeight);

  const [title, setTitle] = useState("");
  const [totalStock, setTotalStock] = useState("1");
  const [openAt, setOpenAt] = useState(() => nowAsDatetimeLocalValue());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isFormValid =
    title.trim().length > 0 &&
    openAt.length > 0 &&
    totalStock.trim().length > 0 &&
    Number(totalStock) > 0;

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isFormValid) return;

    const openAtDate = new Date(openAt);
    if (openAtDate.getTime() <= Date.now()) {
      setErrorMessage("오픈 시각은 지금보다 미래여야 해요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await createCampaign({
        title: title.trim(),
        totalStock: Number(totalStock),
        openAt: openAtDate.toISOString(),
      });
      // 생성 즉시 상세 화면(관리자 뷰)으로 이동 — 공유 링크 복사는 그 화면에 있음
      navigate(`/campaigns/${result.shortCode}`, {
        replace: true,
        state: { from: "mycampaigns" },
      });
    } catch {
      setErrorMessage("행사를 만드는 중 문제가 발생했어요. 다시 시도해주세요.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <title>행사 추가 - GIVEMETICKET</title>
      {/* marginTop은 CampaignSubPageShell 내부가 아니라 이 바깥 wrapper에 줌 —
          CampaignSubPageShell은 행사 수정/신청자 목록과도 공유하는 컴포넌트라
          거길 건드리면 그 두 화면까지 영향받을 수 있음. margin-top은 자식이
          몇 겹이든 상관없이 그 블록 전체를 그만큼 아래로 밀어내므로, 이렇게
          바깥에서 감싸는 것만으로 CampaignDetailPage.tsx가 자기 콘텐츠
          컨테이너에 직접 주는 것과 시각적으로 동일한 효과를 냄. */}
      <div
        style={
          isScrollOffsetActive && pendingScrollOffset !== null
            ? { marginTop: pendingScrollOffset }
            : undefined
        }
      >
        <CampaignSubPageShell title="행사 추가" backButtonFallback="/mycampaigns">
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-6 rounded-2xl border p-6"
            style={{ borderColor: "var(--line)" }}
          >
            <CampaignFormFields
              title={title}
              onTitleChange={setTitle}
              totalStock={totalStock}
              onTotalStockChange={setTotalStock}
              openAt={openAt}
              onOpenAtChange={setOpenAt}
            />

            {errorMessage && (
              <p className="text-xs text-(--warn)">{errorMessage}</p>
            )}

            <div className="self-end">
              <PrimaryButton
                type="submit"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? "추가 중..." : "추가"}
              </PrimaryButton>
            </div>
          </form>
        </CampaignSubPageShell>
      </div>

      {/* CampaignDetailPage.tsx와 동일한 이유의 스페이서 — margin-top 없이
          형제로 둬서, 폼 자체가 짧아 문서 전체 높이가 오프셋+뷰포트보다
          모자라도 스크롤 가능 영역이 절대 그 아래로는 안 줄어들게 함. */}
      {isScrollOffsetActive && pendingScrollOffset !== null && (
        <div aria-hidden style={{ height: viewportHeightAtMount }} />
      )}
    </>
  );
}
