import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

// 로딩 표시 — 회전하는 아이콘 + 안내 문구.
//
// position: fixed로 뷰포트 정중앙에 고정함. 처음엔 패딩 기반(그 자리에서 자연스럽게
// 흐름을 따라가는 방식)으로 했는데, 그러면 이 컴포넌트가 놓이는 위치마다(로그인
// 콜백 화면은 헤더 없음, 목록 화면은 헤더+탭+필터줄까지 있음) 실제 화면상 위치가
// 계속 달라져서 화면 전환마다 로딩 위치가 들쭉날쭉해 보이는 문제가 있었음. fixed로
// 두면 주변에 뭐가 있든(헤더든 탭이든) 전혀 영향 안 받고 항상 뷰포트 정중앙에 뜸.
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-(--ink) text-(--paper)">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="text-(--brand-blue)"
      >
        <Loader2 size={32} strokeWidth={2} />
      </motion.div>
      <p className="text-sm text-(--muted)">불러오는 중...</p>
    </div>
  );
}
