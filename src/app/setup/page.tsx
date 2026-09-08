import type { Metadata } from 'next';
import { byId } from '@/data/art/catalog';
import { CAMPAIGNS, ICESPIRE_ACT1 } from '@/data/campaigns/icespire-act1';
import { coinArt, itemArtMap, rosterArt } from '@/lib/game/roster.server';
import { SetupFlow } from './_components/setup-flow';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Role Master — La compañía',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Before the story: each player picks a character, reads the sheet and what
 * the campaign holds for them. Art is resolved here; the choice is client
 * state until the company is confirmed and saved.
 */
const SetupPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams;
  const model =
    one(params.model) === 'claude-fable-5-1'
      ? 'claude-fable-5-1'
      : 'claude-opus-5';
  const deathParam = one(params.death);
  const death =
    deathParam === 'never' || deathParam === 'possible'
      ? deathParam
      : 'unlikely';
  const campaign = CAMPAIGNS[one(params.campaign) ?? ''] ?? ICESPIRE_ACT1;

  return (
    <SetupFlow
      campaign={{ id: campaign.id, title: campaign.title }}
      coinArt={coinArt()}
      cover={byId('scenes/fr/triboar-trail-klaus-pillon')}
      death={death}
      itemArt={itemArtMap()}
      model={model}
      roster={rosterArt()}
    />
  );
};

export default SetupPage;
