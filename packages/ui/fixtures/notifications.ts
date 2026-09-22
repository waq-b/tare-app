import type { NotificationItemData } from './types';

export const notifications: readonly NotificationItemData[] = [
  {
    id: 'n1',
    category: 'safety',
    title: 'How is your right shoulder?',
    body: 'You flagged it on Thu 17 Sep.',
    at: '2026-09-22T08:00:00+01:00',
    read: false,
    response: 'better_same_worse',
  },
  {
    id: 'n2',
    category: 'coach',
    title: 'Weekly review ready',
    body: '4 proposed changes to look at.',
    at: '2026-09-20T19:03:00+01:00',
    read: false,
    response: 'open_review',
  },
  {
    id: 'n3',
    category: 'plan',
    title: 'Session B today',
    body: 'Push + pull, about 55 minutes.',
    at: '2026-09-22T07:30:00+01:00',
    read: true,
  },
  {
    id: 'n4',
    category: 'sync',
    title: 'All sessions synced',
    body: 'Your coach can see everything up to Sat 19 Sep.',
    at: '2026-09-19T12:40:00+01:00',
    read: true,
  },
];
