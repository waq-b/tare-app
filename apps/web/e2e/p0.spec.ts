// The whole P0 loop in a real browser against the built PWA: sign in, onboard, a whole
// workout offline (with a reload mid-way), sync when back online, then export and restore
// on a fresh phone. The API is e2e/mock-api.ts; sign-in is the e2e fake (code 11111111).
import { devices, expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:4175';
const TUESDAY = new Date('2026-09-22T18:00:00'); // session A in the starter plan

async function signIn(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await page.getByRole('textbox', { name: 'Code' }).fill('11111111');
}

async function closeRest(page: Page) {
  const rest = page.getByRole('dialog', { name: 'Rest' });
  await expect(rest).toBeVisible();
  await rest.getByRole('button', { name: 'Close' }).click();
  await expect(rest).toBeHidden();
}

/** At a person's pace: the footer ignores a second tap within 600 ms (a double tap). */
const pace = (page: Page) => page.waitForTimeout(650);

/** Logs the current set the way a lifter would: one tap on Done. */
async function logOneSet(page: Page) {
  await pace(page);
  await page.getByRole('button', { name: /^Done/ }).click();
  await closeRest(page);
}

test('onboard, a whole workout offline, reload mid-way, sync, export and restore', async ({
  page,
  context,
  browser,
  request,
}) => {
  await page.clock.setFixedTime(TUESDAY);

  // Sign in and onboard.
  await signIn(page);
  await expect(page).toHaveURL(/\/onboarding\/welcome$/);
  await page.getByRole('button', { name: 'I understand, let’s start' }).click();
  const groups = page.getByRole('radiogroup');
  await expect(groups).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await groups
      .nth(i)
      .getByRole('radio', { name: i === 0 ? 'Yes' : 'No' })
      .click();
  }
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue setup' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Build my plan' }).click();
  await expect(page.getByRole('heading', { name: 'Your plan' })).toBeVisible();
  await page.getByRole('button', { name: /Starting weights · optional/ }).click();
  for (const [label, kg] of [
    ['Back squat · kg', '70'],
    ['Lat pulldown · kg', '45'],
    ['Leg press · kg', '100'],
    ['Chest-supported DB row · kg per hand', '16'],
    ['DB curl · kg per hand', '10'],
  ] as const) {
    await page.getByLabel(label).fill(kg);
  }
  await page.getByRole('button', { name: 'Start training' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Start workout' })).toBeVisible();

  // Let the service worker take control, then lose the network.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText('Session A · Squat + pull')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);

  // A whole workout, offline.
  await page.getByRole('button', { name: 'Start workout' }).click();
  await expect(page.getByRole('heading', { name: 'Back squat' })).toBeVisible();
  await logOneSet(page);
  await logOneSet(page);

  // Reload mid-workout (offline): it comes back exactly where it was.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Back squat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set 2 done, undo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark set 3 done as planned' })).toBeVisible();

  for (let guard = 0; guard < 40; guard++) {
    if (await page.getByRole('button', { name: 'Finish workout' }).isVisible()) break;
    const next = page.getByRole('button', { name: 'Next exercise' });
    if (await next.isVisible()) {
      await pace(page);
      await next.click();
      await expect(next).toBeHidden();
      continue;
    }
    await logOneSet(page);
  }
  await pace(page);
  await page.getByRole('button', { name: 'Finish workout' }).click();
  await expect(page.getByRole('heading', { name: 'Session done.' })).toBeVisible();
  await expect(page.getByText('14', { exact: true })).toBeVisible(); // 3+3+3+3+2 working sets
  await page.getByRole('radio', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Done for today.' })).toBeVisible();
  await expect(page.getByText('Offline: logging still works')).toBeVisible();

  // The workout hadn't reached the server while offline (onboarding synced before, online).
  const offlineState = (await (await request.get(`${API}/__state`)).json()).byTable;
  expect(offlineState.workouts).toBeUndefined();
  expect(offlineState.sets).toBeUndefined();

  // Back online: it syncs on its own.
  await context.setOffline(false);
  await expect
    .poll(async () => (await (await request.get(`${API}/__state`)).json()).byTable, {
      timeout: 30_000,
    })
    .toMatchObject({ workouts: 1, sets: 14, profile: 1, plans: 1, screening: 1 });
  await expect(page.getByText('Offline: logging still works')).toBeHidden();

  // Export a backup.
  await page.goto('/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export all data/ }).click();
  const file = await (await download).path();

  // A fresh phone with no network to the API: restore from the file.
  const fresh = await browser.newContext({
    ...devices['Pixel 7'],
    baseURL: 'http://localhost:4174',
    serviceWorkers: 'allow',
  });
  await fresh.route(`${API}/**`, (r) => r.abort());
  const phone = await fresh.newPage();
  await phone.clock.setFixedTime(TUESDAY);
  await signIn(phone);
  await expect(phone).toHaveURL(/\/onboarding\/welcome$/);
  await phone.getByRole('link', { name: 'Restore from a backup' }).click();
  await phone.getByLabel('Backup file').setInputFiles(file);
  await expect(phone.getByRole('heading', { name: 'Done for today.' })).toBeVisible();
  await phone.goto('/history');
  await phone.getByRole('link', { name: /Session A/ }).click();
  await expect(phone.getByRole('heading', { name: 'Back squat' })).toBeVisible();
  await fresh.close();
});
