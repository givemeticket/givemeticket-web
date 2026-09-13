import {
  type ApplicationDetail,
  type CampaignDetail,
} from "../api/campaignApi";
import { formatDateTimeKo } from "@/shared/lib/formatDate";
import { SecondaryButton } from "@/shared/components/buttons/SecondaryButton";
import { FixedWidthLabel } from "@/shared/components/buttons/FixedWidthLabel";
import { CampaignInfoGrid } from "./CampaignInfoGrid";
import { OwnerPanel } from "./OwnerPanel";
import { ApplySection } from "./ApplySection";
import { CopyLinkButton } from "./CopyLinkButton";

interface CampaignDetailInfoColumnProps {
  /** 아직 상세 API 응답 전이면 undefined — 그동안은 대기 문구만 보여줌
   * (CampaignDetailPage.tsx가 카드는 placeholder로 먼저 그리는 것과 별개로,
   * 이 컬럼은 viewerRole/myApplication처럼 진짜 상세 데이터가 있어야만
   * 정확히 그릴 수 있음). */
  campaign: CampaignDetail | undefined;
  hasActiveApplication: boolean;
  myApplicationDetail: ApplicationDetail | undefined;
  hasStockValue: boolean;
  remainingStock: number | undefined;
  isActing: boolean;
  actionError: string;
  onApply: () => void;
  onCampaignOpened: () => void;
  onCancelClick: () => void;
  onDeleteClick: () => void;
  onCloseClick: () => void;
  /** "수정"/"신청자 목록"처럼 카드 없는 페이지로 이동하기 직전 호출 —
   * OwnerPanel.tsx로 그대로 전달됨(그쪽 prop 설명 참고). */
  onBeforeNavigateToNonCardPage: () => void;
}

// CampaignDetailPage.tsx의 "오른쪽 정보 컬럼"(제목/오픈·주최·잔여 정보/관리
// 아이콘/신청영역/에러문구)을 분리함 — 카드 쪽의 layoutId/motion 애니메이션과는
// 완전히 무관한 순수 콘텐츠라 분리해도 animation.md류 리스크가 없음(반대로 카드를
// 감싸는 motion.div는 일부러 페이지에 그대로 남겨둠 — animation.md 30번,
// CampaignCard.tsx 상단 주석 참고).
export function CampaignDetailInfoColumn({
  campaign,
  hasActiveApplication,
  myApplicationDetail,
  hasStockValue,
  remainingStock,
  isActing,
  actionError,
  onApply,
  onCampaignOpened,
  onCancelClick,
  onDeleteClick,
  onCloseClick,
  onBeforeNavigateToNonCardPage,
}: CampaignDetailInfoColumnProps) {
  if (!campaign) {
    return <p className="text-sm text-(--muted)">불러오는 중...</p>;
  }

  return (
    <div className="flex w-full flex-col items-start gap-5">
      {/* claude.ai/design Mobile Screens 목업(행사 상세)은 이 제목을 따로 안
          보여줌 — 위 카드(모바일 와이드 레이아웃)가 이미 배지+제목 줄을
          갖고 있어서 중복이라 모바일에서는 숨김. 데스크톱은 카드가 264px로
          작아서 이 큰 제목이 여전히 필요하니 기존대로 유지. 순서 번호(order)는
          데스크톱 기준(1~5)만 명시하고 h2 자체는 기본값 0이라 모바일에서
          숨겨지는 것과 무관하게 항상 맨 앞자리를 유지함. */}
      <h2 className="hidden text-2xl font-bold text-pretty sm:block">
        {campaign.title}
      </h2>

      {/* 링크 복사(누구나) + 관리 아이콘(수정/삭제/종료, 관리자만) — 같은 줄.
          모바일에서는 목업처럼 카드 바로 아래(정보 그리드보다 위)로 순서만
          옮김 — 정렬/간격은 OwnerPanel.tsx가 데스크톱과 동일하게(왼쪽 정렬 +
          일정 간격) 그리므로 폭은 내용에 맞춤(w-full 불필요). */}
      <div className="order-1 sm:order-3">
        {campaign.viewerRole === "OWNER" ? (
          <OwnerPanel
            campaign={campaign}
            isActing={isActing}
            onDelete={onDeleteClick}
            onClose={onCloseClick}
            onBeforeNavigateToNonCardPage={onBeforeNavigateToNonCardPage}
            leadingContent={
              <CopyLinkButton
                url={`${window.location.origin}/campaigns/${campaign.shortCode}`}
                align="left"
              />
            }
          />
        ) : (
          <div className="flex items-center gap-2">
            <CopyLinkButton
              url={`${window.location.origin}/campaigns/${campaign.shortCode}`}
              align="left"
            />
          </div>
        )}
      </div>

      {/* 신청하기 / 신청취소 — 역할과 무관하게 공통 처리 (관리자도 신청 가능).
          모바일에서는 목업처럼 관리 아이콘 바로 아래·가운데 정렬로, 데스크톱은
          기존대로 정보 그리드 아래·왼쪽 정렬 유지. */}
      <div className="order-2 self-center sm:order-4 sm:self-auto">
        {hasActiveApplication && campaign.myApplication ? (
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <p className="text-sm text-(--muted)">
              신청시각:{" "}
              <span className="font-semibold text-(--paper)">
                {myApplicationDetail?.appliedAt
                  ? formatDateTimeKo(myApplicationDetail.appliedAt)
                  : "불러오는 중..."}
              </span>
            </p>
            {campaign.status !== "CLOSED" && (
              <SecondaryButton onClick={onCancelClick} disabled={isActing}>
                {/* minWidthText는 신청하기/카운트다운 버튼과 동일하게
                    "00:00:00" — 같은 자리에서 바뀌는 버튼은 아니지만,
                    시각적으로 나란히/번갈아 보이는 액션 버튼들의 너비를
                    통일해 둠(ApplySection.tsx 참고). */}
                <FixedWidthLabel
                  text={isActing ? "처리 중..." : "신청 취소"}
                  minWidthText="00:00:00"
                />
              </SecondaryButton>
            )}
          </div>
        ) : (
          <ApplySection
            campaign={campaign}
            hasStockValue={hasStockValue}
            isActing={isActing}
            onApply={onApply}
            onCampaignOpened={onCampaignOpened}
          />
        )}
      </div>

      <div className="order-3 w-full sm:order-2">
        <CampaignInfoGrid
          openAtLabel={formatDateTimeKo(campaign.openAt)}
          ownerNickname={campaign.owner.nickname}
          ownerProfileImageUrl={campaign.owner.profileImageUrl}
          remainingStock={hasStockValue ? remainingStock : undefined}
          totalStock={campaign.totalStock ?? undefined}
        />
      </div>

      {actionError && (
        <p className="order-4 text-xs text-(--warn) sm:order-5">
          {actionError}
        </p>
      )}
    </div>
  );
}
