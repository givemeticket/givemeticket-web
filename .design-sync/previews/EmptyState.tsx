import { Ticket, Archive } from "lucide-react";
import { EmptyState } from "@/shared/components/feedback/EmptyState";

// "나의 티켓" 탭이 비어있을 때 실제로 쓰이는 문구 그대로.
export function NoTickets() {
  return (
    <EmptyState
      icon={<Ticket size={24} strokeWidth={1.6} />}
      title="아직 신청한 행사가 없어요"
      description="공유받은 링크로 들어가서 신청하면 여기에 나타나요"
    />
  );
}

// 설명이 두 줄 이상으로 길어지는 경우 - max-w-xs로 줄바꿈되는 실제 동작을
// 보여줌(텍스트 위주 컴포넌트라 줄바꿈/줄간격이 브랜드 폰트로 제대로
// 적용되는지 확인하는 용도).
export function LongDescription() {
  return (
    <EmptyState
      icon={<Archive size={22} strokeWidth={1.7} />}
      title="만료된 행사가 없어요"
      description="삭제되거나 종료된 행사가 여기 모여요. 행사가 종료되거나 주최자가 삭제하면 이 목록으로 옮겨집니다."
    />
  );
}
