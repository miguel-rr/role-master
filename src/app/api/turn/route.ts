import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { NextResponse } from 'next/server';
import { CAMPAIGNS, type Campaign } from '@/data/campaigns/icespire-act1';
import { env } from '@/env';
import {
  monsterVocabulary,
  PLACE_TAGS,
  resolveTurn,
} from '@/lib/game/art-resolver';
import { mockTurn } from '@/lib/game/mock-narrator';
import { buildMessages, tableState, VOICE } from '@/lib/game/prompt';
import {
  type SceneTurn,
  sceneTurnSchemaFor,
  type TurnRequest,
  type TurnResponse,
  turnRequestSchema,
} from '@/lib/game/schema';
import { resolveSound } from '@/lib/sound/resolver';

// The narrator can take a while at high effort; give it room.
export const maxDuration = 300;

let client: Anthropic | null = null;
const anthropic = () => {
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
};

type Narrated =
  | { ok: true; turn: SceneTurn; usage?: TurnResponse['usage'] }
  | { ok: false; status: number; error: string; issues?: unknown };

/** Asks Claude for the next scene as structured output. */
const narrateWithClaude = async (
  req: TurnRequest,
  campaign: Campaign,
): Promise<Narrated> => {
  if (!env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      status: 500,
      error: 'Falta ANTHROPIC_API_KEY en el servidor.',
    };
  }
  const ids = req.players.map((p) => p.characterId);
  const schema = sceneTurnSchemaFor(ids);
  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: VOICE, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `# BIBLIA DE CAMPAÑA: ${campaign.title}\n${campaign.tagline}\n${campaign.levelRange}\nRitmo previsto: ${campaign.duration.sessions} de 2-3 horas (${campaign.duration.hours}). ${campaign.duration.note}\n\n${campaign.bible}`,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: tableState(req, {
        places: PLACE_TAGS,
        monsters: monsterVocabulary().slice(0, 80),
      }),
    },
  ];
  const isFable = req.model === 'claude-fable-5-1';
  const params = {
    model: req.model,
    max_tokens: 16000,
    stream: false,
    system,
    messages: buildMessages(req, campaign),
    output_config: { format: zodOutputFormat(schema), effort: 'high' },
    // Fable's safety classifiers can decline a turn; let the API re-run it
    // on another model instead of cutting the session.
    ...(isFable
      ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }
      : {}),
  } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming;
  const response = await anthropic().beta.messages.create(params);
  if (response.stop_reason === 'refusal') {
    return {
      ok: false,
      status: 422,
      error: 'El narrador ha declinado este turno. Prueba otra acción.',
    };
  }
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  const turn = schema.safeParse(JSON.parse(text));
  if (!turn.success) {
    return {
      ok: false,
      status: 502,
      error: 'El narrador ha devuelto una escena mal formada',
      issues: turn.error.issues,
    };
  }
  const usage = response.usage;
  return {
    ok: true,
    turn: turn.data,
    usage: {
      input: usage.input_tokens,
      output: usage.output_tokens,
      cached: usage.cache_read_input_tokens ?? 0,
    },
  };
};

/**
 * One narrator turn. The client sends the table state and the players'
 * action; we build the layered prompt, ask Claude for a structured scene,
 * resolve art for it and return it. With MOCK_NARRATOR=1 the scripted
 * narrator answers instead and the API is never called.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = turnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Petición inválida', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const req = parsed.data;
  const campaign = CAMPAIGNS[req.campaignId];
  if (!campaign) {
    return NextResponse.json({ error: 'Campaña desconocida' }, { status: 404 });
  }

  try {
    const narrated: Narrated =
      env.MOCK_NARRATOR === '1'
        ? { ok: true, turn: mockTurn(req) }
        : await narrateWithClaude(req, campaign);
    if (!narrated.ok) {
      return NextResponse.json(
        { error: narrated.error, issues: narrated.issues },
        { status: narrated.status },
      );
    }
    const id = `t${Date.now().toString(36)}`;
    const last = req.history.at(-1)?.turn;
    const { resolved, npcArt } = resolveTurn(
      narrated.turn,
      id,
      req.npcArt,
      last ? { place: last.place, backgroundId: last.backgroundId } : undefined,
    );
    const soundtrack = resolveSound(narrated.turn, `${id}:sound`, last?.sound);
    const payload: TurnResponse = {
      turn: { ...resolved, soundtrack },
      npcArt,
      usage: narrated.usage,
    };
    return NextResponse.json(payload, {
      headers: { 'x-narrator': env.MOCK_NARRATOR === '1' ? 'mock' : 'claude' },
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic ${error.status}: ${error.message}` },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
