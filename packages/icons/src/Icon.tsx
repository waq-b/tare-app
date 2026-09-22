import { uiIcons } from './generated/icons.ts';
import { renderNodes, Svg, type A11yProps } from './svg.tsx';

export type IconName = keyof typeof uiIcons;
export const iconNames = Object.keys(uiIcons) as IconName[];

export interface IconProps extends A11yProps {
  name: IconName;
  /** Rendered size in px. The grid is always 24. */
  size?: number;
  /** In grid units. The Icons board uses 1.75. */
  strokeWidth?: number;
}

/** Interface icon from the canvas set. Colour follows `currentColor`. */
export function Icon({ name, size = 24, strokeWidth = 1.75, ...a11y }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...a11y}
    >
      {renderNodes(uiIcons[name])}
    </Svg>
  );
}
