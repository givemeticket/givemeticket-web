import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { IconButton } from "@/shared/components/buttons/IconButton";

export function CopyLinkButton({
  url,
  align = "center",
}: {
  url: string;
  /** IconButton/Tooltip에 그대로 전달 — 화면 왼쪽 가장자리에 가까이 놓이면 "left" */
  align?: "center" | "left";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <IconButton
      onClick={handleCopy}
      label={copied ? "복사됨" : "링크 복사"}
      active={copied}
      align={align}
    >
      {copied ? (
        <Check size={17} strokeWidth={1.8} />
      ) : (
        <Link2 size={17} strokeWidth={1.7} />
      )}
    </IconButton>
  );
}
