import type { PropsWithChildren } from "react";

type TagGroupProps = PropsWithChildren<{
  compact?: boolean;
  uniform?: boolean;
  inline?: boolean;
  className?: string;
}>;

export function TagGroup(props: TagGroupProps) {
  const classes = ["status-tags"];
  if (props.compact) classes.push("status-tags-compact");
  if (props.uniform) classes.push("status-tags-uniform");
  if (props.inline) classes.push("status-tags-inline");
  if (props.className) classes.push(props.className);
  return <div className={classes.join(" ")}>{props.children}</div>;
}
