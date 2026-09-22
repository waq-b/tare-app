// Board: Tokens.dc.html. Live from @tare/tokens; each swatch shows its dark · light values.
import { cssVar, tokens, type ColorName } from '@tare/tokens';
import type { Meta, StoryObj } from '@storybook/react-vite';
import s from './foundations.module.css';

const meta = { title: 'Foundations/Tokens', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;

const colours = Object.keys(tokens.color.dark) as ColorName[];

function Colour() {
  return (
    <section>
      <h2 className={s['h2']}>Colour</h2>
      <div className={s['grid']}>
        {colours.map((c) => (
          <div key={c} className={s['swatch']}>
            <span className={s['chip']} style={{ background: cssVar(c) }} />
            <span className={s['mono']}>--{c}</span>
            <span className={`${s['mono']} ${s['dim']}`}>
              {tokens.color.dark[c]} · {tokens.color.light[c]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Type() {
  return (
    <section>
      <h2 className={s['h2']}>Type</h2>
      {Object.entries(tokens.type).map(([name, t]) => (
        <div key={name} className={s['row']}>
          <span className={`${s['mono']} ${s['dim']}`}>
            {name} · {t.size}/{t.weight}
          </span>
          <span
            style={{
              fontFamily: `var(--type-${name}-family)`,
              fontSize: `var(--type-${name}-size)`,
              fontWeight: `var(--type-${name}-weight)`,
              lineHeight: `var(--type-${name}-line)`,
              letterSpacing: `var(--type-${name}-tracking)`,
              fontVariantNumeric: `var(--type-${name}-numeric)`,
              textTransform: t.uppercase ? 'uppercase' : 'none',
            }}
          >
            {t.family === 'mono'
              ? '72.5 × 8'
              : name === 'label'
                ? 'Last time'
                : 'Nothing changes until you accept it.'}
          </span>
        </div>
      ))}
    </section>
  );
}

function Spacing() {
  return (
    <section>
      <h2 className={s['h2']}>Space · radius · elevation</h2>
      <div className={s['flex']}>
        {Object.entries(tokens.space).map(([k, v]) => (
          <div key={k} className={s['iconCell']}>
            <span style={{ width: v, height: v, background: 'var(--accent)' }} />
            <span className={s['mono']}>
              {k} · {v}
            </span>
          </div>
        ))}
      </div>
      <div className={s['flex']} style={{ marginTop: 16 }}>
        {Object.keys(tokens.radius).map((k) => (
          <div key={k} className={s['box']} style={{ borderRadius: `var(--radius-${k})` }}>
            <span className={s['mono']}>{k}</span>
          </div>
        ))}
      </div>
      <div className={s['flex']} style={{ marginTop: 16 }}>
        {[0, 1, 2].map((l) => (
          <div
            key={l}
            className={s['box']}
            style={{
              borderRadius: 'var(--radius-lg)',
              background: `var(--elev-${l}-surface)`,
              borderColor: `var(--elev-${l}-border)`,
              boxShadow: `var(--elev-${l}-shadow)`,
            }}
          >
            elev.{l}
          </div>
        ))}
      </div>
    </section>
  );
}

function Motion() {
  return (
    <section>
      <h2 className={s['h2']}>Motion and touch</h2>
      {Object.entries(tokens.motion).map(([k, v]) => (
        <div key={k} className={s['row']}>
          <span className={s['mono']}>motion.{k}</span>
          <span className={s['dim']}>
            {typeof v === 'number' ? v : `${v.duration} ms · ${v.easing}`}
          </span>
        </div>
      ))}
      {Object.entries(tokens.touch).map(([k, v]) => (
        <div key={k} className={s['row']}>
          <span className={s['mono']}>touch.{k}</span>
          <span className={s['dim']}>{v}px</span>
        </div>
      ))}
    </section>
  );
}

function Safety() {
  return (
    <section>
      <h2 className={s['h2']}>
        Safety levels (colour + emphasis; words come from safety_rules.json)
      </h2>
      {Object.entries(tokens.safety).map(([action, v]) => (
        <div key={action} className={s['row']}>
          <span className={s['mono']}>{action}</span>
          <span className={s['dim']}>
            <span className={s['mono']}>--{v.color}</span> · {v.emphasis}
          </span>
        </div>
      ))}
    </section>
  );
}

export const Tokens: StoryObj = {
  render: () => (
    <div className={s['page']}>
      <p className={s['lede']}>
        A quiet instrument: ink ground, warm-white text, one accent. Colour only means something
        when it’s semantic. Source: packages/tokens/src/tokens.json.
      </p>
      <Colour />
      <Type />
      <Spacing />
      <Motion />
      <Safety />
    </div>
  ),
};
