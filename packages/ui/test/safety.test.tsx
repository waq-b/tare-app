// @vitest-environment jsdom
// Hard line 3: every safety rule's user_message is shown exactly as written, and the screen
// adds no copy of its own beyond the fixed action labels, service links and the lock note.
import { safetyRules, services } from '@tare/data';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SAFETY_LEVELS, SafetyScreen } from '../src/components/SafetyScreen/SafetyScreen';
import { serviceActions, type Region, type ServiceData } from '../src/lib/services';

const svc = services() as unknown as Record<string, ServiceData>;
afterEach(cleanup);

describe('SafetyScreen', () => {
  it.each(safetyRules().map((r) => [r.id, r] as const))(
    '%s shows its user_message verbatim',
    (_, rule) => {
      render(<SafetyScreen rule={rule} services={svc} region="england" />);
      expect(screen.getByTestId('safety-message').textContent).toBe(rule.user_message);
    },
  );

  it('has a fixed label for every action in the data', () => {
    for (const r of safetyRules()) expect(SAFETY_LEVELS[r.action], r.action).toBeDefined();
  });

  it.each(safetyRules().map((r) => [r.id, r] as const))('%s adds no copy of its own', (_, rule) => {
    const { container } = render(<SafetyScreen rule={rule} services={svc} region="england" />);
    const level = SAFETY_LEVELS[rule.action];
    const allowed = new Set<string>([
      level?.eyebrow ?? '',
      level?.title ?? '',
      rule.user_message,
      'Sources',
      'Set by the safety rules. Your AI coach can’t change or soften this.',
      ...serviceActions(rule.services, svc, 'england').flatMap((a) => [a.label, a.note ?? '']),
      ...rule.sources.flatMap((s) => [s.org, s.title, `(${s.year})`]),
      ' (opens outside Tare)',
      ' · ',
    ]);
    // Every text node must be one of the allowed strings (or a part of one).
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const unknown: string[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent ?? '';
      if (!t.trim()) continue;
      if (![...allowed].some((a) => a.includes(t.trim()))) unknown.push(t);
    }
    expect(unknown).toEqual([]);
  });

  it.each(safetyRules().map((r) => [r.id, r] as const))(
    '%s links every source and service',
    (_, rule) => {
      render(<SafetyScreen rule={rule} services={svc} region="england" />);
      for (const s of rule.sources)
        if (s.url) expect(document.querySelector(`a[href="${s.url}"]`), s.url).not.toBeNull();
      for (const a of serviceActions(rule.services, svc, 'england')) {
        expect(document.querySelector(`a[href="${a.href}"]`), a.href).not.toBeNull();
      }
    },
  );

  it('999 rules put Call 999 first as a phone link', () => {
    const rule = safetyRules().find((r) => r.id === 'chest_pain_emergency');
    if (!rule) throw new Error('missing rule');
    render(<SafetyScreen rule={rule} services={svc} region="scotland" />);
    const first = screen.getAllByRole('link')[0];
    expect(first?.getAttribute('href')).toBe('tel:999');
    expect(within(first as HTMLElement).getByText('Call 999')).toBeTruthy();
  });

  it('uses the right 111 service for each UK nation', () => {
    const ids = ['nhs_111'];
    const hrefs = (r: Region) => serviceActions(ids, svc, r).map((a) => a.href);
    expect(hrefs('england')).toEqual(['tel:111', 'https://111.nhs.uk/']);
    expect(hrefs('wales')).toEqual(['tel:111', 'https://111.wales.nhs.uk/']);
    expect(hrefs('scotland')).toEqual(['tel:111', 'https://www.nhs24.scot/']);
    expect(hrefs('northern_ireland')).toEqual([svc['nhs_111']?.northern_ireland?.url]);
  });

  it('says so when a link is England-only', () => {
    const [gp] = serviceActions(['gp_finder'], svc, 'wales');
    expect(gp?.note).toBe(svc['gp_finder']?.note);
    const [gpEngland] = serviceActions(['gp_finder'], svc, 'england');
    expect(gpEngland?.note).toBeUndefined();
  });
});
