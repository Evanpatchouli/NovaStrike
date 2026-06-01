type CardCollapseButtonProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function CardCollapseButton(props: CardCollapseButtonProps) {
  return (
    <button className="card-collapse-btn" onClick={props.onToggle} title={props.collapsed ? "展开" : "折叠"} type="button">
      {props.collapsed ? "◂" : "▾"}
    </button>
  );
}
