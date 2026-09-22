// Hard line 5: components are pure. These tests prove the lint rule and the colour rule bite.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const pkg = fileURLToPath(new URL('..', import.meta.url));
const repo = join(pkg, '../..');

function files(dir: string, ext: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((d) => d.isFile() && d.name.endsWith(ext))
    .map((d) => join(d.parentPath, d.name));
}

/** Raw colours: hex, rgb()/rgba(), hsl()/hsla(). Components must use tokens (`var(--…)`). */
export function rawColours(css: string): string[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return noComments.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g) ?? [];
}

describe('no raw colours in component CSS', () => {
  it('catches hex and rgb()', () => {
    expect(rawColours('.a { color: #fff; background: rgba(0,0,0,.5) }')).toHaveLength(2);
    expect(rawColours('.a { color: var(--text); } /* #fff in a comment is fine */')).toEqual([]);
  });

  it.each(files(join(pkg, 'src'), '.module.css').map((f) => relative(pkg, f)))('%s', (file) => {
    expect(rawColours(readFileSync(join(pkg, file), 'utf8'))).toEqual([]);
  });
});

describe('purity lint rule', () => {
  const eslint = new ESLint({ cwd: repo });
  const lint = async (code: string, file = 'packages/ui/src/components/X/X.tsx') => {
    const [res] = await eslint.lintText(code, { filePath: join(repo, file) });
    return (res?.messages ?? []).map((m) => m.ruleId);
  };

  it('rejects data imports inside components', async () => {
    expect(await lint("import { vpt } from '@tare/data';\nexport const x = vpt;\n")).toContain(
      'no-restricted-imports',
    );
  });

  it('rejects fixture imports inside components', async () => {
    expect(
      await lint("import { plan } from '../../../fixtures';\nexport const x = plan;\n"),
    ).toContain('no-restricted-imports');
    expect(
      await lint("import { plan } from '../../../fixtures/plan';\nexport const x = plan;\n"),
    ).toContain('no-restricted-imports');
  });

  it('rejects network and storage inside components', async () => {
    expect(await lint('export const x = () => fetch("/x");\n')).toContain('no-restricted-globals');
    expect(await lint('export const x = () => localStorage.getItem("k");\n')).toContain(
      'no-restricted-globals',
    );
  });

  it('allows stories to load data', async () => {
    expect(
      await lint(
        "import { vpt } from '@tare/data';\nexport const x = vpt;\n",
        'packages/ui/src/components/X/X.stories.tsx',
      ),
    ).not.toContain('no-restricted-imports');
  });
});
