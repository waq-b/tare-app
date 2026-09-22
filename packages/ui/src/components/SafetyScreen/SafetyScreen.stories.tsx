import { safetyRules, services } from '@tare/data';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ServiceData } from '../../lib/services';
import { Button } from '../Button/Button';
import { SafetyScreen } from './SafetyScreen';

const svc = services() as unknown as Record<string, ServiceData>;
const rules = safetyRules();
const byId = Object.fromEntries(rules.map((r) => [r.id, r]));
const first = (action: string) => rules.find((r) => r.action === action)?.id ?? rules[0]!.id;

type Args = { ruleId: string; region: 'england' | 'wales' | 'scotland' | 'northern_ireland' };

const meta = {
  title: 'Components/Safety/SafetyScreen',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    ruleId: {
      control: 'select',
      options: rules.map((r) => r.id),
      name: 'Rule (safety_rules.json)',
    },
    region: {
      control: 'inline-radio',
      options: ['england', 'wales', 'scotland', 'northern_ireland'],
    },
  },
  args: { ruleId: first('stop_now_call_999'), region: 'england' },
  render: ({ ruleId, region }: Args) => (
    <div style={{ width: 390, minHeight: 844 }}>
      <SafetyScreen rule={byId[ruleId]!} services={svc} region={region} />
    </div>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Call999: Story = {};
export const Contact111: Story = { args: { ruleId: first('stop_and_contact_111') } };
export const Contact111NorthernIreland: Story = {
  args: { ruleId: first('stop_and_contact_111'), region: 'northern_ireland' },
};
export const SeeGP: Story = { args: { ruleId: 'pain_not_doms' } };
export const SeeGPWales: Story = { args: { ruleId: 'pain_not_doms', region: 'wales' } };
export const ReduceOrRest: Story = { args: { ruleId: first('reduce_or_rest') } };
export const ModifyExercise: Story = {
  args: { ruleId: 'pain_during_exercise' },
  render: ({ ruleId, region }: Args) => (
    <div style={{ width: 390, minHeight: 844 }}>
      <SafetyScreen
        rule={byId[ruleId]!}
        services={svc}
        region={region}
        actions={
          <>
            <Button variant="swap" fullWidth>
              Continue with changes
            </Button>
            <Button variant="secondary-outline" fullWidth>
              End session
            </Button>
          </>
        }
      />
    </div>
  ),
};
export const ContinueWithCaution: Story = { args: { ruleId: 'doms_normal' } };
