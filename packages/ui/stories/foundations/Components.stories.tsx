// Board: Components.dc.html. An index of the seed components; each has its own stories.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../src/components/Button/Button';
import s from './foundations.module.css';

const meta = { title: 'Foundations/Components' } satisfies Meta;
export default meta;

export const Components: StoryObj = {
  render: () => (
    <div className={s['page']}>
      <p className={s['lede']}>
        The seed components from the Components board. Each one has full stories under Components;
        this page shows them together. The build list is docs/DESIGN.md §3.
      </p>
      <section>
        <h2 className={s['h2']}>Button · 60 / 52</h2>
        <div className={s['flex']}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>
    </div>
  ),
};
