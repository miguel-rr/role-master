import { expect, type Page, test } from '@playwright/test';

/**
 * A whole short campaign without the API: menu → both players choose →
 * company → play through the scripted story with dice, free text, the sheet
 * and the pack, a creature reveal, effects and persistence.
 */

const SHOTS = 'test-results/shots';

/** Advances through the beats of the current turn until the choices show. */
const readThrough = async (page: Page) => {
  const choices = page.getByTestId('choices');
  // The grid's class flips the moment the last beat is read; the opacity
  // follows half a second later (and lags the other way on a new turn).
  const shown = () =>
    choices.evaluate((el) => el.classList.contains('opacity-100'));
  for (let i = 0; i < 16 && !(await shown()); i += 1) {
    // Space and Enter finish the typewriter, then move to the next beat.
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  await expect(choices).toHaveClass(/opacity-100/);
  await expect(choices).toHaveCSS('opacity', '1');
};

/** Waits for the narrator to answer and the next turn to render. */
const nextTurn = async (page: Page, turn: number) => {
  await expect(page.getByTestId('game-stage')).toHaveAttribute(
    'data-turn',
    String(turn),
  );
  await expect(page.getByTestId('thinking')).toHaveCount(0);
};

/** Throws the dice in the tray and accepts the result. */
const rollDice = async (page: Page) => {
  const modal = page.getByTestId('dice-modal');
  await expect(modal).toBeVisible();
  // Nothing has been rolled yet: the players press "Tirar".
  await expect(page.getByTestId('dice-accept')).toHaveCount(0);
  await page.getByTestId('dice-roll').click();
  await page.getByTestId('dice-accept').click();
  await expect(modal).toHaveCount(0);
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // A clean table once per tab; reloads must keep the saved game.
    if (!sessionStorage.getItem('e2e-fresh')) {
      localStorage.removeItem('role-master:game:v2');
      sessionStorage.setItem('e2e-fresh', '1');
    }
    localStorage.setItem('role-master:dice-2d', '1');
  });
});

test('Lon and Jato play a complete short story', async ({ page }) => {
  const turnResponses: unknown[] = [];
  page.on('response', async (res) => {
    if (!res.url().endsWith('/api/turn') || !res.ok()) return;
    // Hard stop if the server would ever reach for the real narrator.
    expect(res.headers()['x-narrator']).toBe('mock');
    turnResponses.push(await res.json());
  });

  // ── Menu ─────────────────────────────────────────────────────────────
  await page.goto('/');
  await expect(page.getByText('Seis personajes esperan')).toBeVisible();
  await page.getByTestId('model-claude-fable-5-1').click();
  await page.getByTestId('death-possible').click();
  await page.getByTestId('start-campaign').click();
  await expect(page).toHaveURL(/\/setup\?/);

  // ── Lon chooses ──────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lon');
  await page.screenshot({ path: `${SHOTS}/01-setup-gallery.png` });
  // A card selects without confirming; "Seleccionar otro" goes back.
  await page.getByTestId('card-bram').click();
  const selection = page.getByTestId('selection');
  await expect(selection).toContainText('Bram Piedrahonda');
  await expect(page.getByTestId('seat-Lon')).not.toContainText('Bram');
  await page.getByTestId('select-other').click();
  await expect(selection).toHaveCount(0);
  await page.getByTestId('card-dagna').click();
  await expect(selection).toContainText('Dagna Yunquebronce');
  await page.screenshot({ path: `${SHOTS}/02-selection.png` });
  // The sheet, the story and the pack, all before confirming.
  await page.getByTestId('view-sheet').click();
  const dossier = page.getByTestId('dossier');
  await expect(dossier).toContainText('Puntos de golpe');
  await expect(dossier).toContainText('Dominio de la Vida');
  await page.screenshot({ path: `${SHOTS}/03-dossier-sheet.png` });
  await page.getByTestId('dossier-story').click();
  await expect(dossier).toContainText('Lo que la campaña le guarda');
  await expect(dossier).toContainText('Dazlyn');
  await page.getByTestId('dossier-pack').click();
  await expect(dossier).toContainText('Mochila de Dagna');
  await page.getByTestId('dossier-close').click();
  await expect(dossier).toHaveCount(0);
  await expect(selection).toBeVisible();
  await page.getByTestId('confirm-character').click();
  await expect(page.getByTestId('seat-Lon')).toContainText('Dagna');

  // ── Jato chooses ─────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jato');
  await expect(page.getByTestId('card-dagna')).toBeDisabled();
  await expect(page.getByTestId('card-dagna')).toContainText('Elegido por Lon');
  await page.getByTestId('card-corran').click();
  // Confirming from inside the dossier works too.
  await page.getByTestId('view-story').click();
  await page.getByTestId('pick-character').click();

  // ── The company ──────────────────────────────────────────────────────
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'La compañía',
  );
  await expect(page.getByTestId('company-dagna')).toContainText('Lon');
  await expect(page.getByTestId('company-corran')).toContainText('Jato');
  await expect(page.getByText('Narrador Fable 5.1')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/04-company.png` });
  // Jato can still change their mind from the company screen.
  await page.getByTestId('redo-jato').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Jato');
  await expect(page.getByTestId('seat-Lon')).toContainText('Dagna');
  await page.getByTestId('card-corran').click();
  await page.getByTestId('confirm-character').click();
  await expect(page.getByTestId('company-corran')).toContainText('Jato');
  await page.getByTestId('begin-adventure').click();
  await expect(page).toHaveURL(/\/play$/);

  // ── Turn 1: the tavern, Toblen speaks ────────────────────────────────
  await nextTurn(page, 1);
  await expect(page.getByTestId('place')).toContainText('Ciervo Dormido');
  await expect(page.getByTestId('backdrop')).not.toHaveAttribute(
    'data-background',
    '',
  );
  // No roll has been made for us: nothing is shown as already rolled.
  await expect(page.getByTestId('last-decision')).toHaveCount(0);
  await expect(page.getByTestId('hud-dagna')).toContainText('Lon');
  await expect(page.getByTestId('hud-corran')).toContainText('Jato');
  await readThrough(page);
  await expect(page.getByTestId('figure')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/05-tavern.png` });

  // The sheet and the pack, from the HUD, mid-scene.
  await page.getByTestId('hud-dagna').click();
  const overlay = page.getByTestId('party-overlay');
  await expect(overlay).toContainText('Dagna Yunquebronce');
  await expect(overlay).toContainText('Puntos de golpe');
  await page.screenshot({ path: `${SHOTS}/06-overlay-sheet.png` });
  // Objects open their card, on the sheet and in the pack.
  await page.getByTestId('item-tile').first().click();
  const card = page.getByTestId('item-card');
  await expect(card).toContainText('Martillo de guerra');
  await expect(card).toContainText('1d8 contundente');
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(overlay).toBeVisible();
  await page.getByTestId('overlay-view-pack').click();
  await expect(overlay).toContainText('Mochila de Dagna');
  await page.getByTestId('overlay-tab-corran').click();
  await expect(overlay).toContainText('Mochila de Corran');
  await page.getByRole('button', { name: 'Arco largo' }).click();
  await expect(card).toContainText('Arma marcial a distancia');
  await expect(card).toContainText('Munición (45/183 m)');
  await page.screenshot({ path: `${SHOTS}/07-overlay-pack.png` });
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await page.getByRole('button', { name: 'Flechas' }).click();
  await expect(card).toContainText('Flechas');
  await page.mouse.click(5, 450);
  await expect(card).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(overlay).toHaveCount(0);

  // A decision with a check: the tray opens and the players roll.
  const rollChoice = page
    .getByTestId('choice')
    .and(page.locator('[data-roll="yes"]'));
  await expect(rollChoice.first()).toContainText('Tirada:');
  await rollChoice.first().click();
  await page.screenshot({ path: `${SHOTS}/08-dice-tray.png` });
  await rollDice(page);

  // ── Turn 2: the outcome is remembered next to the new text ───────────
  await nextTurn(page, 2);
  const lastDecision = page.getByTestId('last-decision');
  await expect(lastDecision).toContainText('Última decisión');
  await expect(lastDecision).toContainText('Persuasión · CD 12');
  await expect(page.getByTestId('last-roll-verdict')).toHaveText(
    /Éxito|Fallo|¡Crítico!|Pifia/,
  );
  await page.screenshot({ path: `${SHOTS}/09-last-decision.png` });
  await readThrough(page);
  const noRoll = page
    .getByTestId('choice')
    .and(page.locator('[data-roll="no"]'));
  await noRoll.first().click();

  // ── Turn 3: a new place, a free-text action ──────────────────────────
  await nextTurn(page, 3);
  await expect(page.getByTestId('place')).toContainText('Sendero de Triboar');
  await readThrough(page);
  await page.getByTestId('custom-who-both').click();
  await page
    .getByTestId('custom-input')
    .fill('Silbamos una canción de taberna para no oír el bosque.');
  await page.getByTestId('custom-input').press('Enter');

  // ── Turn 4: the creature reveals itself ──────────────────────────────
  await nextTurn(page, 4);
  await expect(page.getByTestId('place')).toContainText('Colina Umbrage');
  await expect(lastDecision).toContainText('«Silbamos una canción');
  await readThrough(page);
  await expect(page.getByTestId('figure')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/10-creature.png` });
  // Initiative: the tray again, with the seat colour of the roller.
  await rollChoice.first().click();
  await expect(page.getByTestId('dice-modal')).toContainText('Iniciativa');
  await rollDice(page);

  // ── Turn 5: effects land on the sheet ────────────────────────────────
  await nextTurn(page, 5);
  // Adabra's 25 gold on top of 15, minus the coin Toblen keeps if the
  // first Persuasion check failed: the dice are real, both paths are fine.
  await expect(page.getByTestId('hud-stats-dagna')).toContainText(/(39|40) po/);
  await readThrough(page);
  await page.getByTestId('hud-corran').click();
  await page.getByTestId('overlay-view-pack').click();
  await expect(overlay).toContainText('Poción de curación de Adabra');
  await page.getByTestId('overlay-close').click();
  await noRoll.first().click();

  // ── Turn 6: epilogue, then the save survives a reload ────────────────
  await nextTurn(page, 6);
  await expect(page.getByTestId('place')).toContainText('Phandalin');
  await readThrough(page);
  await expect(page.getByText('Fin de la escena.')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('game-stage')).toHaveAttribute(
    'data-turn',
    '6',
  );
  await expect(page.getByTestId('place')).toContainText('Phandalin');

  // The menu offers to continue, naming the players and their characters.
  await page.goto('/');
  await expect(page.getByText('Lon lleva a Dagna')).toBeVisible();
  await page.getByTestId('continue-campaign').click();
  await expect(page).toHaveURL(/\/play$/);
  await nextTurn(page, 6);

  // The scripted narrator never reports token usage: the API was not used.
  expect(turnResponses.length).toBe(6);
  for (const r of turnResponses)
    expect((r as { usage?: unknown }).usage).toBeUndefined();
});

test('the design lab tavern rolls with the real tray', async ({ page }) => {
  await page.goto('/design/scenes');
  const rollChoice = page.getByRole('button', { name: /Pagar sin regatear/ });
  for (let i = 0; i < 12; i += 1) {
    if (await rollChoice.isVisible()) break;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
  // The scene strip at the bottom can overlap the choices on short screens.
  await rollChoice.dispatchEvent('click');
  await expect(page.getByTestId('dice-modal')).toBeVisible();
  await expect(page.getByTestId('dice-accept')).toHaveCount(0);
  await page.getByTestId('dice-roll').click();
  await page.getByTestId('dice-accept').click();
  await expect(page.getByTestId('dice-modal')).toHaveCount(0);
  await expect(
    page.getByText(/Éxito|Fallo|¡Crítico!|Pifia/).first(),
  ).toBeVisible();
});
