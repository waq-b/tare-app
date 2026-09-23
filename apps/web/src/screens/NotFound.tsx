import { Icon } from '@tare/icons';
import { Button, EmptyState, TopBar } from '@tare/ui';
import s from './screens.module.css';

export function NotFound() {
  return (
    <>
      <TopBar title="Not found" />
      <main className={s['body']}>
        <EmptyState
          icon={<Icon name="info" size={28} />}
          title="There’s nothing here"
          actions={
            <Button href="/" fullWidth>
              Go to Today
            </Button>
          }
        />
      </main>
    </>
  );
}
