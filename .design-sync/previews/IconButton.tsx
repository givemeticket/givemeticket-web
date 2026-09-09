import { Link2, Check, Trash2, ArrowUpDown, Ban } from "lucide-react";
import { IconButton } from "@/shared/components/buttons/IconButton";

// CopyLinkButton의 기본 상태 - 링크 복사 아이콘. 회색조(muted)가 기본색.
export function Default() {
  return (
    <IconButton onClick={() => {}} label="링크 복사">
      <Link2 size={17} strokeWidth={1.7} />
    </IconButton>
  );
}

// active=true - CopyLinkButton이 "복사됨" 상태일 때(브랜드 블루 강조색 +
// 은은한 배경). 눌린/선택된 상태를 표현하는 핵심 변주 축.
export function Active() {
  return (
    <IconButton onClick={() => {}} label="복사됨" active>
      <Check size={17} strokeWidth={1.8} />
    </IconButton>
  );
}

// tone="warn" - OwnerPanel의 삭제 버튼처럼 되돌릴 수 없는 위험한 동작은 색
// 자체를 경고색으로 고정함(active 여부와 무관).
export function Warn() {
  return (
    <IconButton onClick={() => {}} label="삭제" tone="warn">
      <Trash2 size={17} strokeWidth={1.7} />
    </IconButton>
  );
}

// size="sm"(32px) - CampaignApplicantsPage의 정렬 순서 변경 버튼. 기본
// md(36px)보다 한 단계 작은 크기 축.
export function Small() {
  return (
    <IconButton onClick={() => {}} label="정렬 순서 변경" size="sm">
      <ArrowUpDown size={16} strokeWidth={2} />
    </IconButton>
  );
}

// disabled - OwnerPanel의 종료 버튼이 다른 작업 처리 중(isActing)일 때.
export function Disabled() {
  return (
    <IconButton onClick={() => {}} label="종료" disabled>
      <Ban size={17} strokeWidth={1.7} />
    </IconButton>
  );
}
