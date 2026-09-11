import { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  /** 소셜 프로필 이미지. 사용자가 동의 안 했거나 비로그인 상태면 없음 */
  src?: string | null;
  /** 없어도 됨 — 이제 이니셜 대신 아이콘을 쓰기 때문에 표시엔 안 쓰이고, 접근성
   * 라벨(aria-label)로만 참고용으로 씀 */
  name?: string;
  /** px 단위 지름 */
  size?: number;
}

// 프로필 사진이 있으면 원형으로, 없으면(비로그인 포함) 사람 실루엣 아이콘으로 대체 표시.
// 예전엔 이름 첫 글자를 썼는데, 비로그인 상태에선 이름 자체가 없어서 아이콘으로 통일함.
export function Avatar({ src, name, size = 20 }: AvatarProps) {
  // src만 보고 무조건 <img>를 그리면, 404나 만료된 URL일 때 깨진 이미지
  // 아이콘이 그대로 남는다 — onError로 로드 실패를 감지해서 아래 아이콘
  // 폴백으로 전환함. src 자체가 바뀌면(다른 사람의 프로필로 교체 등) 이전
  // 실패 상태가 새 URL에도 그대로 남으면 안 되는데, 이펙트로 초기화하면
  // "실패 상태로 한 번 렌더된 뒤 다음 틱에 초기화되는" 깜빡임 + 불필요한
  // 리렌더가 생겨서(react-hooks/set-state-in-effect 린트 경고), 대신 렌더링
  // 중에 이전 src와 비교해서 즉시 초기화하는 React 공식 패턴을 씀
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [prevSrc, setPrevSrc] = useState(src);
  const [imgFailed, setImgFailed] = useState(false);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setImgFailed(false);
  }

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--ink-soft)",
        color: "var(--muted)",
      }}
      aria-label={name}
    >
      <User size={size * 0.6} strokeWidth={2} />
    </span>
  );
}
