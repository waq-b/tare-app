/** Every interactive element must be at least 48×48 (touch.min). Checkboxes and radios are
 * measured by their label, which is the real hit area. A story can opt out with
 * `parameters: { touchTargets: false }`, only where a larger hit area wraps a smaller visual. */
export const TOUCH_MIN = 48;
const INTERACTIVE =
  'a[href], button, input, select, textarea, [role="switch"], [role="radio"], [role="checkbox"], [tabindex="0"]';

export function smallTargets(root: HTMLElement): string[] {
  const out: string[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(INTERACTIVE)) {
    if (el.closest('[aria-hidden="true"]')) continue;
    const target = el instanceof HTMLInputElement ? (el.closest('label') ?? el) : el;
    const r = target.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.width < TOUCH_MIN - 0.5 || r.height < TOUCH_MIN - 0.5) {
      const label =
        el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30) ?? el.tagName;
      out.push(
        `<${el.tagName.toLowerCase()}> "${label}" is ${Math.round(r.width)}×${Math.round(r.height)}`,
      );
    }
  }
  return [...new Set(out)];
}
