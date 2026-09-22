// Boards: Settings, Connect-AI.
import { vpt } from '@tare/data';
import { Icon } from '@tare/icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { profile, screeningArea } from '../../fixtures';
import { Button } from '../../src/components/Button/Button';
import { Card } from '../../src/components/Card/Card';
import { CopyField } from '../../src/components/CopyField/CopyField';
import { ListRow } from '../../src/components/ListRow/ListRow';
import { PromptBlock } from '../../src/components/PromptBlock/PromptBlock';
import { SectionLabel } from '../../src/components/SectionLabel/SectionLabel';
import { StatusDot } from '../../src/components/StatusDot/StatusDot';
import { Tag } from '../../src/components/Tag/Tag';
import { TopBar } from '../../src/components/TopBar/TopBar';
import { ScreenBody, ScreenFrame } from './Screen';
import s from './screen.module.css';

const meta = { title: 'Screens/Settings', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;

export const Home: StoryObj = {
  render: () => (
    <ScreenFrame>
      <TopBar back={{ href: '#' }} title="Settings" />
      <ScreenBody gap={22}>
        <Card href="#" aria-label="Connect your AI, connected">
          <div className={s['row']}>
            <Icon name="coach" size={22} />
            <span style={{ flexGrow: 1, fontWeight: 600 }}>Connect your AI</span>
            <Tag tone="progress">Connected</Tag>
          </div>
          <p className={s['lede']} style={{ fontSize: 14 }}>
            Your own Claude reads your logs and writes the weekly review. Last run Sun 20 Sep,
            19:02.
          </p>
        </Card>
        <div>
          <SectionLabel>You</SectionLabel>
          <ListRow
            leading={<Icon name="user" size={22} />}
            title="Profile"
            value={profile.name}
            href="#"
          />
          <ListRow
            leading={<Icon name="target" size={22} />}
            title="Goals"
            value="Fat loss, then muscle"
            href="#"
          />
          <ListRow
            leading={<Icon name="dumbbell" size={22} />}
            title="Gym kit"
            value={`${profile.kit.length} items`}
            href="#"
          />
          <ListRow
            leading={<Icon name="scale" size={22} />}
            title="Units"
            value={`${profile.units} · per hand`}
            href="#"
          />
          <ListRow
            leading={<Icon name="heart" size={22} />}
            title="Health answers"
            subtitle="Synced to your account"
            value={`${screeningArea.area.charAt(0).toUpperCase()}${screeningArea.area.slice(1)} noted`}
            href="#"
          />
          <ListRow
            leading={<Icon name="bell" size={22} />}
            title="Notifications"
            subtitle="Safety follow-ups are always on"
            href="#"
          />
        </div>
        <div>
          <SectionLabel>Data</SectionLabel>
          <ListRow
            leading={<Icon name="download" size={22} />}
            title="Export all data"
            value="JSON · CSV"
            href="#"
          />
          <ListRow
            leading={<Icon name="book" size={22} />}
            title="Rulebook"
            value={`vpt v${vpt().version}`}
            href="#"
          />
          <ListRow
            leading={<Icon name="link" size={22} />}
            title="Sources"
            value={String(Object.keys(vpt().sources).length)}
            href="#"
          />
        </div>
        <div>
          <SectionLabel>About</SectionLabel>
          <ListRow leading={<Icon name="shield" size={22} />} title="Not medical advice" href="#" />
          <ListRow
            leading={<Icon name="info" size={22} />}
            title="About Tare"
            value="v0.1.0"
            href="#"
          />
        </div>
      </ScreenBody>
    </ScreenFrame>
  ),
};

/** The short bootstrap: the full coach instructions live behind get_coach_brief (P2). */
const BOOTSTRAP = 'Use the Tare tools. Call get_coach_brief first and follow what it says.';

export const ConnectYourAI: StoryObj = {
  name: 'Connect your AI',
  render: () => (
    <ScreenFrame>
      <TopBar back={{ href: '#' }} title="Connect your AI" />
      <ScreenBody gap={20}>
        <Card>
          <StatusDot tone="progress">MCP server connected</StatusDot>
          <CopyField value="https://tare.example.com/mcp" copyLabel="Copy server URL" />
        </Card>
        <div className={s['stack']}>
          <SectionLabel>Start prompt for a Claude project</SectionLabel>
          <PromptBlock label="Start prompt">{BOOTSTRAP}</PromptBlock>
          <Button variant="secondary" size={52} icon={<Icon name="copy" size={20} />} fullWidth>
            Copy prompt
          </Button>
        </div>
        <Card>
          <SectionLabel as="h2">Scheduled review</SectionLabel>
          <div>
            <ListRow title="Last run" value="Sun 20 Sep, 19:02 · OK" valueMono />
            <ListRow title="Next" value="Sun 27 Sep, 19:00" valueMono />
          </div>
        </Card>
        <Button variant="secondary-outline" size={52} fullWidth>
          Test connection
        </Button>
      </ScreenBody>
    </ScreenFrame>
  ),
};
