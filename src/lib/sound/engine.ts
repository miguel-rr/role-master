'use client';

import type { SoundEntry } from '@/data/sound/schema';

/**
 * The table's sound desk: four buses into a master limiter. Music streams
 * through two alternating <audio> elements with equal-power crossfades;
 * ambience beds are decoded buffers looped without gaps, with spot sounds
 * scheduled at random; effects and interface sounds are one-shots.
 *
 * Browsers keep the AudioContext suspended until a user gesture: call
 * `unlock()` from a click. Everything after that plays without gestures.
 */

type Bus = 'music' | 'ambience' | 'effects' | 'ui';

type Mix = Record<Bus, number> & { enabled: boolean };

type Status = 'idle' | 'running' | 'suspended' | 'unsupported';

type Ambience = { beds: SoundEntry[]; spots: SoundEntry[] };

type Snapshot = {
  status: Status;
  mix: Mix;
  musicId: string | null;
  bedIds: string[];
  lastCue: string | null;
};

const STORAGE_KEY = 'role-master:sound:v1';
const DEFAULT_MIX: Mix = {
  enabled: true,
  music: 0.7,
  ambience: 0.8,
  effects: 0.9,
  ui: 0.6,
};

const loadMix = (): Mix => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MIX;
    return { ...DEFAULT_MIX, ...(JSON.parse(raw) as Partial<Mix>) };
  } catch {
    return DEFAULT_MIX;
  }
};

const saveMix = (mix: Mix) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mix));
  } catch {
    /* private mode */
  }
};

/** Equal-power curve: keeps the perceived level steady through a crossfade. */
const equalPower = (t: number) => Math.cos((1 - t) * 0.5 * Math.PI);

const supportsOpus = () => {
  try {
    return (
      document.createElement('audio').canPlayType('audio/webm; codecs=opus') !==
      ''
    );
  } catch {
    return false;
  }
};

const srcOf = (entry: SoundEntry, opus: boolean) =>
  opus || !entry.srcFallback ? entry.src : entry.srcFallback;

const dbToGain = (db: number) => 10 ** (db / 20);

type MusicPlayer = {
  el: HTMLAudioElement;
  gain: GainNode;
  entryId: string | null;
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses: Record<Bus, GainNode> | null = null;
  private players: [MusicPlayer, MusicPlayer] | null = null;
  private active = 0;
  private beds: {
    id: string;
    source: AudioBufferSourceNode;
    gain: GainNode;
  }[] = [];
  private spots: SoundEntry[] = [];
  private spotTimer: number | null = null;
  private lastSpot: string | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private opus = true;
  private listeners = new Set<() => void>();
  private snapshot: Snapshot = {
    status: 'idle',
    mix: DEFAULT_MIX,
    musicId: null,
    bedIds: [],
    lastCue: null,
  };
  /** What should be playing, so a late unlock can catch up. */
  private wanted: { music: SoundEntry | null; ambience: Ambience | null } = {
    music: null,
    ambience: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.snapshot = { ...this.snapshot, mix: loadMix() };
      this.opus = supportsOpus();
    }
  }

  // ── React plumbing ──────────────────────────────────────────────────

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.snapshot;

  private emit(patch: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const fn of this.listeners) fn();
  }

  // ── Context ─────────────────────────────────────────────────────────

  /** Creates or resumes the context. Must run inside a user gesture. */
  async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) {
      this.emit({ status: 'unsupported' });
      return false;
    }
    if (!this.ctx) {
      const ctx = new Ctx({ latencyHint: 'playback' });
      const master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -6;
      limiter.knee.value = 6;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      master.connect(limiter).connect(ctx.destination);
      const bus = (v: number) => {
        const g = ctx.createGain();
        g.gain.value = v;
        g.connect(master);
        return g;
      };
      const mix = this.snapshot.mix;
      this.buses = {
        music: bus(mix.music),
        ambience: bus(mix.ambience),
        effects: bus(mix.effects),
        ui: bus(mix.ui),
      };
      this.master = master;
      master.gain.value = mix.enabled ? 1 : 0;
      this.ctx = ctx;
      this.players = [this.makePlayer(), this.makePlayer()];
      ctx.addEventListener('statechange', () => {
        this.emit({
          status: ctx.state === 'running' ? 'running' : 'suspended',
        });
      });
    }
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        /* still locked */
      }
    }
    const running = this.ctx.state === 'running';
    this.emit({ status: running ? 'running' : 'suspended' });
    if (running) {
      // Catch up with whatever the scene asked for before the unlock.
      if (this.wanted.music && this.snapshot.musicId !== this.wanted.music.id)
        this.playMusic(this.wanted.music, { fade: 2 });
      if (this.wanted.ambience && this.snapshot.bedIds.length === 0)
        this.setAmbience(this.wanted.ambience, { fade: 2 });
    }
    return running;
  }

  private makePlayer(): MusicPlayer {
    const ctx = this.ctx as AudioContext;
    const el = new Audio();
    el.crossOrigin = 'anonymous';
    el.loop = true;
    el.preload = 'auto';
    const source = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect((this.buses as Record<Bus, GainNode>).music);
    return { el, gain, entryId: null };
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  // ── Mix ─────────────────────────────────────────────────────────────

  setVolume(bus: Bus, value: number) {
    const v = Math.max(0, Math.min(1, value));
    const mix = { ...this.snapshot.mix, [bus]: v };
    saveMix(mix);
    this.emit({ mix });
    if (this.buses && this.ctx) {
      this.buses[bus].gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
    }
  }

  setEnabled(enabled: boolean) {
    const mix = { ...this.snapshot.mix, enabled };
    saveMix(mix);
    this.emit({ mix });
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        enabled ? 1 : 0,
        this.ctx.currentTime,
        0.1,
      );
    }
  }

  // ── Music ───────────────────────────────────────────────────────────

  /** Crossfades to a track; `null` fades the music out. */
  playMusic(entry: SoundEntry | null, { fade = 5 }: { fade?: number } = {}) {
    this.wanted.music = entry;
    if (!this.ctx || !this.players || !this.ready) {
      this.emit({ musicId: entry?.id ?? null });
      return;
    }
    const now = this.ctx.currentTime;
    const current = this.players[this.active] as MusicPlayer;
    if (entry && current.entryId === entry.id) return;
    const next = this.players[1 - this.active] as MusicPlayer;
    // Fade the current one out and stop it once silent.
    if (current.entryId) {
      const el = current.el;
      current.gain.gain.cancelScheduledValues(now);
      current.gain.gain.setValueAtTime(current.gain.gain.value, now);
      current.gain.gain.linearRampToValueAtTime(0, now + fade);
      window.setTimeout(
        () => {
          if (this.players && this.players[this.active] !== current) {
            el.pause();
          }
        },
        fade * 1000 + 100,
      );
      current.entryId = null;
    }
    if (!entry) {
      this.emit({ musicId: null });
      return;
    }
    next.el.src = srcOf(entry, this.opus);
    next.el.currentTime = 0;
    next.entryId = entry.id;
    const target = dbToGain(entry.gain ?? 0);
    next.gain.gain.cancelScheduledValues(now);
    next.gain.gain.setValueAtTime(0.0001, now);
    // Equal-power in three steps keeps it cheap and smooth.
    next.gain.gain.linearRampToValueAtTime(
      target * equalPower(0.5),
      now + fade * 0.5,
    );
    next.gain.gain.linearRampToValueAtTime(target, now + fade);
    void next.el.play().catch(() => {
      /* autoplay refused: unlock() will catch up */
    });
    this.active = 1 - this.active;
    this.emit({ musicId: entry.id });
  }

  // ── Ambience ────────────────────────────────────────────────────────

  private async buffer(entry: SoundEntry): Promise<AudioBuffer> {
    const ctx = this.ctx as AudioContext;
    const cached = this.buffers.get(entry.id);
    if (cached) return cached;
    const p = fetch(srcOf(entry, this.opus))
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data));
    this.buffers.set(entry.id, p);
    p.catch(() => this.buffers.delete(entry.id));
    return p;
  }

  /** Replaces the beds and spot pool; `null` clears the ambience. */
  setAmbience(ambience: Ambience | null, { fade = 3 }: { fade?: number } = {}) {
    this.wanted.ambience = ambience;
    if (!this.ctx || !this.buses || !this.ready) {
      this.emit({ bedIds: ambience?.beds.map((b) => b.id) ?? [] });
      return;
    }
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const keep = new Set(ambience?.beds.map((b) => b.id) ?? []);
    for (const bed of this.beds) {
      if (keep.has(bed.id)) continue;
      bed.gain.gain.cancelScheduledValues(now);
      bed.gain.gain.setValueAtTime(bed.gain.gain.value, now);
      bed.gain.gain.linearRampToValueAtTime(0.0001, now + fade);
      try {
        bed.source.stop(now + fade + 0.05);
      } catch {
        /* already stopped */
      }
    }
    this.beds = this.beds.filter((b) => keep.has(b.id));
    const playing = new Set(this.beds.map((b) => b.id));
    for (const entry of ambience?.beds ?? []) {
      if (playing.has(entry.id)) continue;
      void this.buffer(entry).then((buf) => {
        // The scene may have moved on while we decoded.
        if (!this.wanted.ambience?.beds.some((b) => b.id === entry.id)) return;
        const source = ctx.createBufferSource();
        source.buffer = buf;
        source.loop = true;
        source.loopStart = 0.05;
        source.loopEnd = Math.max(0.1, buf.duration - 0.05);
        const gain = ctx.createGain();
        const target = dbToGain(entry.gain ?? 0);
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(target, t + fade);
        source
          .connect(gain)
          .connect((this.buses as Record<Bus, GainNode>).ambience);
        source.start(t, Math.random() * Math.max(0, buf.duration - 10));
        this.beds.push({ id: entry.id, source, gain });
        this.emit({ bedIds: this.beds.map((b) => b.id) });
      });
    }
    this.spots = ambience?.spots ?? [];
    this.scheduleSpot(true);
    this.emit({ bedIds: ambience?.beds.map((b) => b.id) ?? [] });
  }

  private scheduleSpot(reset = false) {
    if (reset && this.spotTimer) {
      window.clearTimeout(this.spotTimer);
      this.spotTimer = null;
    }
    if (this.spots.length === 0) return;
    const wait = 12000 + Math.random() * 30000;
    this.spotTimer = window.setTimeout(() => {
      this.spotTimer = null;
      const pool = this.spots.filter((s) => s.id !== this.lastSpot);
      const pick = (pool.length > 0 ? pool : this.spots)[
        Math.floor(
          Math.random() *
            Math.max(1, (pool.length > 0 ? pool : this.spots).length),
        )
      ];
      if (pick && this.ready) {
        this.lastSpot = pick.id;
        void this.oneShot(pick, 'ambience', {
          gain: 0.5 + Math.random() * 0.5,
          rate: 0.95 + Math.random() * 0.1,
          pan: Math.random() * 1.4 - 0.7,
        });
      }
      this.scheduleSpot();
    }, wait);
  }

  // ── One-shots ───────────────────────────────────────────────────────

  private async oneShot(
    entry: SoundEntry,
    bus: Bus,
    {
      gain = 1,
      rate = 1,
      pan = 0,
    }: { gain?: number; rate?: number; pan?: number } = {},
  ) {
    if (!this.ctx || !this.buses || !this.ready) return;
    const ctx = this.ctx;
    try {
      const buf = await this.buffer(entry);
      const source = ctx.createBufferSource();
      source.buffer = buf;
      source.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = gain * dbToGain(entry.gain ?? 0);
      let node: AudioNode = source.connect(g);
      if (pan !== 0 && typeof ctx.createStereoPanner === 'function') {
        const p = ctx.createStereoPanner();
        p.pan.value = pan;
        node = node.connect(p);
      }
      node.connect(this.buses[bus]);
      source.start();
    } catch {
      /* a missing file must never break the scene */
    }
  }

  /** A scene effect (door, thunder…). */
  playSfx(entry: SoundEntry) {
    this.emit({ lastCue: entry.tags.cue ?? entry.id });
    void this.oneShot(entry, 'effects', { rate: 0.97 + Math.random() * 0.06 });
  }

  /** An interface sound (page turn, click, dice). */
  playUi(entry: SoundEntry | undefined) {
    if (!entry) return;
    void this.oneShot(entry, 'ui');
  }

  /** Warms the decode cache for the next scene. */
  preload(entries: SoundEntry[]) {
    if (!this.ctx) return;
    for (const e of entries)
      if (e.layer !== 'music') void this.buffer(e).catch(() => undefined);
  }

  /** Stops everything (leaving the game). */
  stopAll() {
    this.playMusic(null, { fade: 1.5 });
    this.setAmbience(null, { fade: 1.5 });
  }
}

let engine: SoundEngine | null = null;

/** The one desk of the page. */
const soundEngine = (): SoundEngine => {
  if (!engine) engine = new SoundEngine();
  return engine;
};

export { DEFAULT_MIX, soundEngine };
export type { Ambience, Bus, Mix, Snapshot, Status };
