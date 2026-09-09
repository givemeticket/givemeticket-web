import { useEffect, useRef } from "react";
import { CopyLinkButton } from "@/features/campaign/components/CopyLinkButton";

// 실제 앱(CampaignDetailPage)이 만드는 url 형식 그대로:
// `${window.location.origin}/campaigns/${campaign.shortCode}`
const URL = "https://givemeticket.site/campaigns/nyc2026fanmeeting";

// 기본(idle) 상태 - 링크 아이콘, "링크 복사" 라벨.
export function Default() {
  return <CopyLinkButton url={URL} />;
}

// 복사 완료 상태 - 클릭 후 1.5초간 체크 아이콘 + "복사됨"으로 바뀜
// (내부 setState라 외부에서 이 상태를 강제로 켤 수 있는 prop이 없음 -
// 실제 onClick 핸들러를 프로그래밍적으로 눌러서 재현함). 실제 브라우저의
// navigator.clipboard.writeText는 존재하더라도 헤드리스 캡처 환경에선
// 권한 문제로 reject될 수 있고, CopyLinkButton의 handleCopy엔 그 실패를
// catch하는 코드가 없어서(await만 함) 실패하면 setCopied가 아예 실행되지
// 않음 - 그래서 항상 성공하는 스텁으로 덮어써서 실제 클릭 흐름이 끝까지
// 정상 진행되게 함(컴포넌트 로직 자체는 그대로, 브라우저 API만 보강).
function CopiedInner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText = async () => {};
      } else {
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: async () => {} },
          configurable: true,
        });
      }
    } catch {
      // 이 환경에서 덮어쓸 수 없다면 무시 - 실제 클립보드 API가 그대로 시도됨
    }
    const btn = containerRef.current?.querySelector("button");
    btn?.click();
  }, []);

  return (
    <div ref={containerRef}>
      <CopyLinkButton url={URL} />
    </div>
  );
}

export function Copied() {
  return <CopiedInner />;
}
