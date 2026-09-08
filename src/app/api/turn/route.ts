import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { NextResponse } from 'next/server';
import { CAMPAIGNS } from '@/data/campaigns/icespire-act1';
import { env } from '@/env';
import {
  monsterVocabulary,
  PLACE_TAGS,
  resolveTurn,
} from '@/lib/game/art-resolver';
import { buildMessages, tableState, VOICE } from '@/lib/game/prompt';
import {
  sceneTurnSchema,
  type TurnResponse,
  turnRequestSchema,
} from '@/lib/game/schema';

// The narrator can take a while at high effort; give it room.
export const maxDuration = 300;

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * One narrator turn. The client sends the table state and the players'
 * action; we build the layered prompt, ask Claude for a structured scene,
 * resolve art for it and return it.
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

  const system: Anthropic.TextBlockParam[] = [
    { type: 'text', text: VOICE, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `# BIBLIA DE CAMPAÑA: ${campaign.title}\n${campaign.tagline}\n${campaign.levelRange}\n\n${campaign.bible}`,
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
  try {
    const params = {
      model: req.model,
      max_tokens: 16000,
      stream: false,
      system,
      messages: buildMessages(req, campaign),
      output_config: {
        format: zodOutputFormat(sceneTurnSchema),
        effort: 'high',
      },
      // Fable's safety classifiers can decline a turn; let the API re-run it
      // on another model instead of cutting the session.
      ...(isFable
        ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }
        : {}),
    } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming;
    const response = await client.beta.messages.create(params);

    if (response.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: 'El narrador ha declinado este turno. Prueba otra acción.' },
        { status: 422 },
      );
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const turn = sceneTurnSchema.safeParse(JSON.parse(text));
    if (!turn.success) {
      return NextResponse.json(
        {
          error: 'El narrador ha devuelto una escena mal formada',
          issues: turn.error.issues,
        },
        { status: 502 },
      );
    }

    const id = `t${Date.now().toString(36)}`;
    const { resolved, npcArt } = resolveTurn(turn.data, id, req.npcArt);
    const usage = response.usage;
    const payload: TurnResponse = {
      turn: resolved,
      npcArt,
      usage: {
        input: usage.input_tokens,
        output: usage.output_tokens,
        cached: usage.cache_read_input_tokens ?? 0,
      },
    };
    return NextResponse.json(payload);
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
