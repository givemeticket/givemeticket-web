interface AvatarProps {
  /** 소셜 프로필 이미지. 사용자가 동의 안 했으면 백엔드가 null로 내려줌 */
  src?: string | null;
  /** null일 때 이니셜 대신 표시할 이름 */
  name: string;
  /** px 단위 지름 */
  size?: number;
}

// 프로필 사진이 있으면 원형으로, 없으면(null) 이름 첫 글자로 대체 표시
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

  const initial = name.trim().charAt(0) || "?";

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        backgroundColor: "var(--ink-soft)",
        color: "var(--muted)",
      }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
