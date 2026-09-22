// Turns a safety rule's `services` (from safety_rules.json → services) into actions for the
// user's UK nation. Pure: the data comes in, links come out. No copy is invented here: labels,
// links and notes all come from the data.

export type Region = 'england' | 'wales' | 'scotland' | 'northern_ireland';

export interface ServiceData {
  label: string;
  tel?: string | null;
  url?: string;
  online?: Partial<Record<Region, string>>;
  northern_ireland?: { tel: string | null; use: string; url: string };
  note?: string;
  [k: string]: unknown;
}

export interface ServiceAction {
  id: string;
  label: string;
  href: string;
  kind: 'tel' | 'web';
  /** Short caveat to show under the action, from the data (e.g. England-only). */
  note?: string;
}

/** England-only services, by their data note. Shown with the note outside England. */
const englandOnly = (s: ServiceData) => /^England\b|In many areas of England/.test(s.note ?? '');

export function serviceActions(
  ids: readonly string[],
  services: Readonly<Record<string, ServiceData>>,
  region: Region,
): ServiceAction[] {
  const out: ServiceAction[] = [];
  for (const id of ids) {
    const s = services[id];
    if (!s) continue;
    if (id === 'nhs_111' && region === 'northern_ireland' && s.northern_ireland) {
      out.push({ id, label: s.northern_ireland.use, href: s.northern_ireland.url, kind: 'web' });
      continue;
    }
    if (s.tel) out.push({ id, label: s.label, href: `tel:${s.tel}`, kind: 'tel' });
    const online = s.online?.[region];
    if (online)
      out.push({ id: `${id}_online`, label: `${s.label} online`, href: online, kind: 'web' });
    if (!s.tel && s.url) {
      out.push({
        id,
        label: s.label,
        href: s.url,
        kind: 'web',
        ...(englandOnly(s) && region !== 'england' && s.note ? { note: s.note } : {}),
      });
    }
  }
  return out;
}
