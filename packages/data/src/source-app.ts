// The slim app bundle, written by `npm run build -w @tare/data` (scripts/build.ts).
import bundle from '../dist/vpt-app.json' with { type: 'json' };
import type { RawVpt } from './load.ts';

export const raw: RawVpt = bundle;
