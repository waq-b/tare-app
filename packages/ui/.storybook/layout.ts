// Layout check run after every story test: nothing may spill out of the story's frame
// (no sideways scrolling), and visible text may not overlap other text.
// Screen-reader-only text is ignored, and so is content behind an open dialog.

const EPS = 1;

const hidden = (el: Element) =>
  el.closest('.sr-only, [aria-hidden="true"]') !== null ||
  getComputedStyle(el).visibility === 'hidden' ||
  getComputedStyle(el).display === 'none';

const describe = (el: Element) => {
  const cls =
    (el.getAttribute('class') ?? '').split(' ')[0]?.replace(/_[a-z0-9]{5}_\d+$/, '') ?? '';
  const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `<${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}> "${text}"`;
};

/** Elements inside a deliberate scroll container (e.g. a wide table's region) may extend. */
const inScroller = (el: Element, root: Element) => {
  for (let p = el.parentElement; p && p !== root; p = p.parentElement) {
    const ox = getComputedStyle(p).overflowX;
    if ((ox === 'auto' || ox === 'scroll') && p.getAttribute('role') === 'region') return true;
  }
  return false;
};

/** A text rect clipped to every ancestor that hides overflow (scroll areas, truncation). */
function clip(r: DOMRect, el: Element, root: Element): DOMRect | null {
  let [l, t, rt, b] = [r.left, r.top, r.right, r.bottom];
  for (let p: Element | null = el; p && p !== root.parentElement; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
    const c = p.getBoundingClientRect();
    l = Math.max(l, c.left);
    t = Math.max(t, c.top);
    rt = Math.min(rt, c.right);
    b = Math.min(b, c.bottom);
  }
  return rt - l > 1 && b - t > 1 ? new DOMRect(l, t, rt - l, b - t) : null;
}

function textBoxes(scope: Element): { el: Element; r: DOMRect }[] {
  const out: { el: Element; r: DOMRect }[] = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.textContent?.trim() || hidden(el) || el.closest('svg')) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const raw of range.getClientRects()) {
      const r = clip(raw, el, scope);
      if (r) out.push({ el, r });
    }
  }
  return out;
}

export function layoutProblems(root: HTMLElement): string[] {
  const problems: string[] = [];
  const frame = root.getBoundingClientRect();

  // 1. Nothing spills past the right edge of the story root (screens are 390px frames).
  for (const el of root.querySelectorAll('*')) {
    if (hidden(el) || inScroller(el, root)) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > frame.right + EPS) {
      problems.push(`${describe(el)} spills ${Math.round(r.right - frame.right)}px past the frame`);
    }
  }

  // 2. No sideways scrolling inside the story (except labelled scroll regions).
  for (const el of [root, ...root.querySelectorAll<HTMLElement>('*')]) {
    if (hidden(el) || el.getAttribute('role') === 'region') continue;
    const cs = getComputedStyle(el);
    // Deliberate one-line truncation ("…") stays inside its box.
    if (cs.textOverflow === 'ellipsis') continue;
    const ox = cs.overflowX;
    if (ox !== 'visible' && ox !== 'clip' && el.scrollWidth > el.clientWidth + EPS) {
      problems.push(`${describe(el)} scrolls sideways (${el.scrollWidth} > ${el.clientWidth})`);
    }
  }

  // 3. Visible text doesn't overlap other text. With a dialog open, only check the dialog.
  const dialog = root.querySelector('[role="dialog"]');
  const boxes = textBoxes(dialog ?? root);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (!a || !b) continue;
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 2 && h > 2) problems.push(`${describe(a.el)} overlaps ${describe(b.el)}`);
    }
  }
  return [...new Set(problems)];
}
