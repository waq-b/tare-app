import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { createAppData, DbProvider } from '../src/data/DbContext.tsx';
import { exportAll, TareDb } from '../src/db/index.ts';
import { createTestRouter } from '../src/routes.tsx';

function renderSettings() {
  const data = createAppData(new TareDb(`settings-${Math.random()}`));
  render(
    <DbProvider data={data}>
      <RouterProvider router={createTestRouter('/settings')} />
    </DbProvider>,
  );
  return data;
}

describe('Settings → Data', () => {
  it('exports a backup file', async () => {
    const data = renderSettings();
    await data.r.weighIns.add({ date: '2026-09-01', time: '07:00', kg: 92, waistCm: null });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('button', { name: /Export all data/ }));
    expect(await screen.findByText('Backup saved')).toBeTruthy();
    expect(click).toHaveBeenCalled();
  });

  it('restores a backup and says what changed', async () => {
    const source = createAppData(new TareDb(`src-${Math.random()}`));
    await source.r.weighIns.add({ date: '2026-09-01', time: '07:00', kg: 92, waistCm: null });
    const file = new File([JSON.stringify(await exportAll(source.db))], 'b.json');
    const data = renderSettings();
    fireEvent.change(screen.getByLabelText('Backup file'), { target: { files: [file] } });
    expect(await screen.findByText('Backup restored')).toBeTruthy();
    expect(screen.getByText('1 added, 0 updated, 0 already here.')).toBeTruthy();
    await waitFor(async () => expect(await data.r.weighIns.list()).toHaveLength(1));
  });

  it('says so when the file isn’t a backup', async () => {
    renderSettings();
    const file = new File(['not json'], 'x.json');
    fireEvent.change(screen.getByLabelText('Backup file'), { target: { files: [file] } });
    expect(await screen.findByText('Couldn’t restore that file')).toBeTruthy();
    expect(screen.getByText('It isn’t a Tare backup.')).toBeTruthy();
  });
});
