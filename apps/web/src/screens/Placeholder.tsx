// Stand-in for screens that arrive later in P0 (T5–T9). Removed once every route is built.
import { Icon } from '@tare/icons';
import { EmptyState, TopBar, type Tab } from '@tare/ui';
import s from './screens.module.css';

export function Placeholder({ title, back }: { tab?: Tab; title: string; back?: string }) {
  return (
    <>
      <TopBar title={title} {...(back ? { back: { href: back } } : {})} />
      <main className={s['body']}>
        <EmptyState icon={<Icon name="info" size={28} />} title={`${title} is on its way`}>
          This screen is being built.
        </EmptyState>
      </main>
    </>
  );
}
