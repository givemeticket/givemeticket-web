import { forwardRef, useImperativeHandle, useRef } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LandingSearchFieldProps {
  className?: string;
  iconSize?: number;
}

// 히어로(LandingHero.tsx)와 클로징 헤더(LandingTopBar.tsx, showSearchInput일
// 때)가 공유하는 실제 검색 입력 필드. 예전엔 버튼처럼 보이게만 만들고
// onClick으로 그냥 /search로 보내버렸는데, 클릭해도 글자를 입력할 수 없어서
// (버튼일 뿐 input이 아니었음) 실제 <input>으로 바꿈. Enter(폼 submit)로
// 검색어를 들고 /search?q=로 이동함 — 검색어가 비어있으면 q 없이 이동
// (SearchResultsPage.tsx가 q를 안 읽는 경우도 이미 처리하고 있음).
export const LandingSearchField = forwardRef<
  HTMLInputElement,
  LandingSearchFieldProps
>(function LandingSearchField({ className, iconSize = 17 }, forwardedRef) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = inputRef.current?.value.trim() ?? "";
        navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
      }}
      // hover:와 focus-within: 둘 다 테두리 색을 바꾸는데, CSS 우선순위가
      // 같아서(둘 다 한 단계 셀렉터) 마우스가 안에 있으면서 동시에
      // focus-within인 상태(딱 검색창을 클릭해서 입력 중인, 가장 흔한
      // 상황)에는 나중에 생성된 규칙이 이김 — 실제로 hover 쪽이 이겨서
      // 마우스가 검색창 위에 있는 동안은 골드 테두리가 안 보이고, 마우스가
      // 벗어나야 그제서야 보이는 문제가 있었음. focus-within 쪽에 !important를
      // 줘서 둘 다 해당되는 상황에서도 항상 focus-within(골드)이 이기게 함.
      className={
        className ??
        "flex h-12 w-[min(340px,calc(100%-160px))] items-center gap-2.5 rounded-full border border-white/34 bg-white/10 px-6 transition-colors hover:border-white/60 focus-within:border-(--brand-yellow)!"
      }
    >
      <Search size={iconSize} strokeWidth={1.8} className="shrink-0 text-white/80" />
      <input
        ref={inputRef}
        type="text"
        placeholder="행사 검색"
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/80"
      />
    </form>
  );
});
