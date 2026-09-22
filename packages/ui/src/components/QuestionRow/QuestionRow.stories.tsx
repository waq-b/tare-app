import { screening } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoiceChip } from '../ChoiceChip/ChoiceChip';
import { QuestionRow } from './QuestionRow';

const qs = screening().questions;
const msk = qs.find((q) => q.id === 'msk_issue')!;

const meta = {
  title: 'Components/Onboarding/QuestionRow',
  component: QuestionRow,
  args: { number: 1, question: qs[0]!.text, value: null },
} satisfies Meta<typeof QuestionRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Unanswered: Story = {};
export const AnsweredNo: Story = { args: { value: 'no' } };
export const YesWithArea: Story = {
  args: {
    number: qs.indexOf(msk) + 1,
    question: msk.text,
    value: 'yes',
    followUp: (
      <div
        role="group"
        aria-label="Which area?"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {['Shoulder', 'Knee', 'Lower back'].map((a) => (
          <ChoiceChip key={a} selected={a === 'Knee'}>
            {a}
          </ChoiceChip>
        ))}
      </div>
    ),
  },
};
