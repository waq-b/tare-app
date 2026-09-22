import { BodyMap } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { painFlags } from '../../../fixtures';
import { Legend } from '../Legend/Legend';

const flags = painFlags.map((f) => ({ area: f.area as 'shoulder', side: f.side, state: f.status }));

const meta = { title: 'Components/Safety/BodyMap' } satisfies Meta;
export default meta;

export const FlagHistory: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <BodyMap view="front" flags={flags} width={80} title="Pain flags, front" />
        <BodyMap view="back" flags={flags} width={80} title="Pain flags, back" />
      </div>
      <Legend
        label="Body map key"
        items={[
          { label: 'Active', color: 'var(--muscle-primary)' },
          { label: 'Cleared', color: 'var(--muscle-secondary)' },
        ]}
      />
    </div>
  ),
};
export const EveryArea: StoryObj = {
  render: () => {
    const all = (
      [
        'neck',
        'shoulder',
        'elbow',
        'wrist',
        'upper_back',
        'lower_back',
        'hip',
        'knee',
        'ankle',
        'calf',
      ] as const
    ).map((area) => ({ area, side: 'both' as const, state: 'active' as const }));
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <BodyMap view="front" flags={all} width={80} title="Every area, front" />
        <BodyMap view="back" flags={all} width={80} title="Every area, back" />
      </div>
    );
  },
};
