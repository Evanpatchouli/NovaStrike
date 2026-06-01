import type { PropsWithChildren } from "react";

type TagTone = "muted" | "good" | "warn" | "danger";

type TagProps = PropsWithChildren<{
  tone?: TagTone;
  className?: string;
  unstyled?: boolean;
}>;

export function Tag(props: TagProps) {
  const toneClass = props.tone ? `tag-${props.tone}` : "";
  const classes = [props.unstyled ? "" : "tag", toneClass, props.className].filter(Boolean).join(" ");
  return <span className={classes}>{props.children}</span>;
}
