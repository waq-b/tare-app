// A stand-in for apps/server in end-to-end runs: the same push/pull contract and
// last-write-wins rules, in memory, with no auth. GET /__state shows what arrived.
import { createServer } from 'node:http';

interface Row {
  table: string;
  id: string;
  record: { id: string; updatedAt: number } & Record<string, unknown>;
  seq: number;
}
const rows = new Map<string, Row>();
let seq = 0;
const port = Number(process.env['PORT'] ?? 4175);

createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'authorization, content-type');
  res.setHeader('access-control-allow-methods', 'GET, POST');
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);
  const json = (code: number, body: unknown) => {
    res.writeHead(code, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  if (url.pathname === '/health') return json(200, { ok: true });
  if (url.pathname === '/__state') {
    const byTable: Record<string, number> = {};
    for (const r of rows.values()) byTable[r.table] = (byTable[r.table] ?? 0) + 1;
    return json(200, { byTable, rows: [...rows.values()] });
  }
  if (url.pathname === '/sync/pull') {
    const since = Number(url.searchParams.get('since') ?? 0);
    const out = [...rows.values()].filter((r) => r.seq > since).sort((a, b) => a.seq - b.seq);
    return json(200, {
      changes: out.map(({ table, id, record }) => ({ table, id, record })),
      cursor: out.at(-1)?.seq ?? since,
      more: false,
    });
  }
  if (url.pathname === '/sync/push' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { changes } = JSON.parse(body) as { changes: Omit<Row, 'seq'>[] };
      let applied = 0;
      for (const c of changes) {
        const k = `${c.table}/${c.id}`;
        const cur = rows.get(k);
        if (cur && cur.record.updatedAt >= c.record.updatedAt) continue;
        rows.set(k, { ...c, seq: ++seq });
        applied++;
      }
      json(200, { received: changes.length, applied });
    });
    return;
  }
  json(404, { error: 'not_found' });
}).listen(port, () => console.log(`mock api on ${port}`));
