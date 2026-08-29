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
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
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
