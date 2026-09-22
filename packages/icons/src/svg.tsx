import { createElement, useId, type ReactNode } from 'react';
import type { IconNode } from './types.ts';

export interface A11yProps {
  /** Accessible name. Without it the icon is decorative (`aria-hidden`). */
  title?: string;
  className?: string;
}

/** Shared <svg> wrapper: decorative by default, labelled when `title` is given. */
export function Svg({
  title,
  className,
  width,
  height,
  viewBox,
  children,
  ...rest
}: A11yProps & {
  width: number;
  height: number;
  viewBox: string;
  children: ReactNode;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'round';
  strokeLinejoin?: 'round';
}) {
  const titleId = useId();
  const a11y = title
    ? { role: 'img', 'aria-labelledby': titleId }
    : { 'aria-hidden': true, focusable: false };
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={viewBox}
      className={className}
      {...a11y}
      {...rest}
    >
      {title ? <title id={titleId}>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Renders extracted canvas geometry. */
export function renderNodes(nodes: readonly IconNode[]): ReactNode[] {
  return nodes.map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }));
}
