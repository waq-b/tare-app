import type { Meta, StoryObj } from '@storybook/react-vite';
import { review, shortDate } from '../../../fixtures';
import { ReviewSummaryCard } from './ReviewSummaryCard';

const meta = {
  title: 'Components/Coach/ReviewSummaryCard',
  component: ReviewSummaryCard,
  args: {
    week: `Week ${review.week} · ${shortDate(review.weekStart).slice(4)}–${shortDate(review.weekEnd).slice(4)}`,
    sessions: `${review.sessionsDone} of ${review.sessionsPlanned} sessions`,
    summary: review.summary,
    writtenAt: 'Sun 20 Sep, 19:02',
  },
} satisfies Meta<typeof ReviewSummaryCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
