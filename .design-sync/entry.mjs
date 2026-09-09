// design-sync가 번들링할 "디자인 시스템" 진입점.
//
// 이 저장소는 별도 컴포넌트 라이브러리 패키지가 아니라 앱 전체이기 때문에,
// 컨버터의 기본 합성(synth-entry) 모드처럼 src/ 전체를 훑으면 페이지·레이아웃·
// 라우트 가드 같은 것까지 전부 "컴포넌트"로 잘못 집어오게 된다. 그래서 사용자와
// 합의한 27개(실제로는 30개, 아래 참고) 컴포넌트만 명시적으로 재노출한다.
//
// 여기 없는 파일을 새로 디자인 시스템에 포함하고 싶으면, 이 파일에 한 줄
// 추가하고 .design-sync/config.json의 componentSrcMap에도 같이 추가할 것.
export * from "../src/shared/components/buttons/PrimaryButton.tsx";
export * from "../src/shared/components/buttons/SecondaryButton.tsx";
export * from "../src/shared/components/buttons/IconButton.tsx";
export * from "../src/shared/components/buttons/FixedWidthLabel.tsx";
export * from "../src/shared/components/overlay/Modal.tsx";
export * from "../src/shared/components/overlay/ConfirmDialog.tsx";
export * from "../src/shared/components/overlay/Tooltip.tsx";
export * from "../src/shared/components/feedback/EmptyState.tsx";
export * from "../src/shared/components/feedback/FullPageMessage.tsx";
export * from "../src/shared/components/feedback/LoadingFade.tsx";
export * from "../src/shared/components/feedback/LoadingScreen.tsx";
export * from "../src/shared/components/feedback/TicketSpinner.tsx";
export * from "../src/shared/components/datetime/WheelColumn.tsx";
export * from "../src/shared/components/datetime/DateTimePickerField.tsx";
export * from "../src/shared/components/Avatar.tsx";
export * from "../src/shared/components/BackButton.tsx";
export * from "../src/shared/components/BrandLogo.tsx";
export * from "../src/features/campaign/components/CampaignCard.tsx";
export * from "../src/features/campaign/components/ApplySection.tsx";
export * from "../src/features/campaign/components/CountdownApplyButton.tsx";
export * from "../src/features/campaign/components/OwnerPanel.tsx";
export * from "../src/features/campaign/components/CopyLinkButton.tsx";
export * from "../src/features/campaign/components/CampaignFormFields.tsx";
export * from "../src/features/campaign/components/CampaignSubPageShell.tsx";
export * from "../src/features/dashboard/components/HeaderTabs.tsx";
export * from "../src/features/dashboard/components/InlineSortFilter.tsx";
export * from "../src/features/dashboard/components/MyTicketsTab.tsx";
export * from "../src/features/dashboard/components/MyCampaignsTab.tsx";
export * from "../src/features/dashboard/components/CampaignListTab.tsx";
export * from "../src/features/auth/components/UserMenu.tsx";
