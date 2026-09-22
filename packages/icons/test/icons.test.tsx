import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  drawnMuscles,
  Icon,
  iconNames,
  movementPatterns,
  MuscleMap,
  muscles,
  PatternIcon,
  patternsWithoutGlyph,
} from '../src/index.ts';

const repo = process.env['REPO_ROOT'] ?? '';
const iconsBoard = readFileSync(join(repo, 'design/canvas/Icons.dc.html'), 'utf8');
const vptEnums = JSON.parse(readFileSync(join(repo, 'vpt/data/exercises.json'), 'utf8')).enums as {
  muscles: string[];
  movement_pattern: string[];
};

/** Every UI icon label under "Interface icons" on the board. */
const boardIconNames = [
  ...iconsBoard
    .slice(iconsBoard.indexOf('Interface icons'))
    .matchAll(/<\/svg><span[^>]*>([a-z-]+)<\/span>/g),
].map((m) => m[1]);

describe('Icon', () => {
  it('has a component for every icon on the Icons board', () => {
    expect(boardIconNames.length).toBe(50);
    expect([...iconNames].sort()).toEqual([...boardIconNames].sort());
  });

  it.each(iconNames)('%s renders geometry', (name) => {
    const { container } = render(<Icon name={name} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.children.length).toBeGreaterThan(0);
  });

  it('is decorative by default', () => {
    const { container } = render(<Icon name="check" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('role')).toBeNull();
  });

  it('is a labelled image when given a title', () => {
    render(<Icon name="flag" title="Flag pain" />);
    expect(screen.getByRole('img', { name: 'Flag pain' })).toBeTruthy();
  });

  it('sizes to the size prop', () => {
    const { container } = render(<Icon name="plus" size={32} />);
    expect(container.querySelector('svg')?.getAttribute('width')).toBe('32');
  });
});

describe('PatternIcon', () => {
  it('uses the vpt movement_pattern enum', () => {
    expect([...movementPatterns]).toEqual(vptEnums.movement_pattern);
  });

  it.each([...movementPatterns])('%s renders', (pattern) => {
    const { container } = render(<PatternIcon pattern={pattern} />);
    expect(container.querySelector('svg')?.children.length).toBeGreaterThan(0);
  });

  it('logs the 4 patterns the canvas does not draw', () => {
    expect([...patternsWithoutGlyph]).toEqual(['cardio', 'plyometric', 'olympic', 'mobility']);
  });
});

describe('MuscleMap', () => {
  it('uses the vpt muscles enum', () => {
    expect([...muscles]).toEqual(vptEnums.muscles);
  });

  it('draws every muscle except neck, abductors and adductors', () => {
    const missing = muscles.filter((m) => !drawnMuscles.includes(m));
    expect(missing).toEqual(['abductors', 'adductors', 'neck']);
  });

  it('marks primary, secondary and idle regions (squat, back view, as on the canvas)', () => {
    const { container } = render(
      <MuscleMap view="back" primary={['glutes']} secondary={['hamstrings', 'lower back']} />,
    );
    const state = (m: string) =>
      [...container.querySelectorAll(`[data-muscle="${m}"]`)].map((e) =>
        e.getAttribute('data-state'),
      );
    expect(state('glutes')).toEqual(['primary', 'primary']);
    expect(state('hamstrings')).toEqual(['secondary', 'secondary']);
    expect(state('lower back')).toEqual(['secondary']);
    expect(state('lats')).toEqual(['idle', 'idle']);
    expect(container.querySelector('[data-muscle="glutes"]')?.getAttribute('fill')).toBe(
      'var(--muscle-primary)',
    );
  });

  it('primary wins when a muscle is in both lists', () => {
    const { container } = render(
      <MuscleMap view="front" primary={['chest']} secondary={['chest']} />,
    );
    expect(container.querySelector('[data-muscle="chest"]')?.getAttribute('data-state')).toBe(
      'primary',
    );
  });

  it('matches the canvas deadlift drawing', () => {
    // Deadlift, back: traps, lats, forearms secondary; lower back, glutes, hamstrings primary.
    const { container } = render(
      <MuscleMap
        view="back"
        primary={['lower back', 'glutes', 'hamstrings']}
        secondary={['traps', 'lats', 'forearms']}
      />,
    );
    const states = [...container.querySelectorAll('svg > :not(title)')].map(
      (e) => e.getAttribute('data-state')?.[0],
    );
    // i = idle, s = secondary, p = primary, per shape in canvas order.
    expect(states.join('')).toBe('isiissipiissppppii');
  });

  it('keeps the 60:150 ratio', () => {
    const { container } = render(<MuscleMap view="front" width={68} title="Worked muscles" />);
    expect(container.querySelector('svg')?.getAttribute('height')).toBe('170');
    expect(screen.getByRole('img', { name: 'Worked muscles' })).toBeTruthy();
  });
});
