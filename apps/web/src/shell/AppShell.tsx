// The app frame: the current screen, the bottom nav on tab screens, and the update prompt.
// @tare/ui components render plain links; the shell routes same-app links client-side.
import { BottomNav, type Tab } from '@tare/ui';
import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import s from './shell.module.css';
import { UpdatePrompt } from './UpdatePrompt.tsx';

const TAB_PATHS: Record<Tab, string> = {
  today: '/',
  plan: '/plan',
  progress: '/progress',
  coach: '/coach',
};

export function tabFor(pathname: string): Tab | null {
  const hit = (Object.entries(TAB_PATHS) as [Tab, string][]).find(([, p]) => p === pathname);
  return hit ? hit[0] : null;
}

/** Route plain same-origin link clicks through the router instead of reloading the page. */
function useClientLinks() {
  const navigate = useNavigate();
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a || a.target || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      e.preventDefault();
      void navigate(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);
}

export function AppShell() {
  const { pathname } = useLocation();
  const tab = tabFor(pathname);
  useClientLinks();
  return (
    <div className={s['app']}>
      <UpdatePrompt />
      <div className={s['screen']}>
        <Outlet />
      </div>
      {tab ? <BottomNav active={tab} hrefFor={(t) => TAB_PATHS[t]} /> : null}
    </div>
  );
}
