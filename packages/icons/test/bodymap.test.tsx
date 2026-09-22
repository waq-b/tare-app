import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BodyMap, bodyAreas, bodyAreasSided, bodyMarkers } from '../src/index.ts';

const vpt = JSON.parse(
  readFileSync(join(process.env['REPO_ROOT'] ?? '', 'vpt/data/exercises.json'), 'utf8'),
).enums;

describe('BodyMap', () => {
  it('uses the vpt body_areas enums', () => {
    expect([...bodyAreas]).toEqual(vpt.body_areas);
    expect([...bodyAreasSided]).toEqual(vpt.body_area_sided);
  });

  it('draws every body area on at least one view', () => {
    for (const a of bodyAreas) {
      const n = bodyMarkers(a, 'both', 'front').length + bodyMarkers(a, 'both', 'back').length;
      expect(n, a).toBeGreaterThan(0);
    }
  });

  it('draws one marker per side for sided areas, and puts the user’s right on the correct side', () => {
    for (const a of bodyAreasSided) {
      const view = bodyMarkers(a, 'both', 'front').length ? 'front' : 'back';
      expect(bodyMarkers(a, 'both', view), a).toHaveLength(2);
      expect(bodyMarkers(a, 'left', view), a).toHaveLength(1);
    }
    // Front view: the user's right shoulder is on the viewer's left (smaller x).
    const [right] = bodyMarkers('shoulder', 'right', 'front');
    const [left] = bodyMarkers('shoulder', 'left', 'front');
    expect(right && 'cx' in right && left && 'cx' in left && right.cx < left.cx).toBe(true);
    const [backRight] = bodyMarkers('shoulder', 'right', 'back');
    expect(
      backRight && 'cx' in backRight && right && 'cx' in right && backRight.cx > right.cx,
    ).toBe(true);
  });

  it('marks active and cleared flags', () => {
    const { container } = render(
      <BodyMap
        view="front"
        flags={[
          { area: 'shoulder', side: 'right', state: 'active' },
          { area: 'knee', side: 'left', state: 'cleared' },
        ]}
      />,
    );
    expect(container.querySelector('[data-area="shoulder"]')?.getAttribute('data-state')).toBe(
      'active',
    );
    expect(container.querySelector('[data-area="knee"]')?.getAttribute('fill')).toBe(
      'var(--muscle-secondary)',
    );
    expect(container.querySelectorAll('[data-area]')).toHaveLength(2);
  });
});
