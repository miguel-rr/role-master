/**
 * Hand-written types for `@3d-dice/dice-box` 1.1 (the package ships none).
 * Only the surface we use.
 */
declare module '@3d-dice/dice-box' {
  type DiceBoxConfig = {
    /** Where the WASM + themes live (must be under public/). */
    assetPath: string;
    /** Origin for assetPath; defaults to window.location.origin. */
    origin?: string;
    theme?: string;
    themeColor?: string;
    scale?: number;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    angularDamping?: number;
    linearDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    offscreen?: boolean;
    delay?: number;
    lightIntensity?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;
    suspendSimulation?: boolean;
    onDieComplete?: (die: DieResult) => void;
    onRollComplete?: (results: RollGroupResult[]) => void;
    onRemoveComplete?: (die: DieResult) => void;
    onThemeConfigLoaded?: (config: unknown) => void;
    onThemeLoaded?: (config: unknown) => void;
  };

  type DieResult = {
    groupId: number;
    rollId: number;
    sides: number;
    theme: string;
    themeColor?: string;
    value: number;
  };

  type RollGroupResult = {
    id: number;
    modifier: number;
    qty: number;
    rolls: DieResult[];
    sides: number;
    theme: string;
    themeColor?: string;
    value: number;
  };

  type RollOptions = {
    theme?: string;
    themeColor?: string;
    newStartPoint?: boolean;
  };

  class DiceBox {
    constructor(container: string, config: DiceBoxConfig);
    constructor(config: DiceBoxConfig & { container: string });
    init(): Promise<DiceBox>;
    /** Loads a theme folder from assetPath/themes/<name>; must run before rolling with it. */
    loadTheme(theme: string): Promise<unknown>;
    getThemeConfig(theme: string): unknown;
    /** Resolves with every die rolled (flat); grouped totals via getRollResults(). */
    roll(
      notation: string | string[],
      options?: RollOptions,
    ): Promise<DieResult[]>;
    add(
      notation: string | string[],
      options?: RollOptions,
    ): Promise<DieResult[]>;
    reroll(die: DieResult | DieResult[]): Promise<DieResult[]>;
    remove(die: DieResult | DieResult[]): Promise<DieResult[]>;
    clear(): DiceBox;
    hide(): DiceBox;
    show(): DiceBox;
    getRollResults(): RollGroupResult[];
    updateConfig(config: Partial<DiceBoxConfig>): Promise<void>;
    onRollComplete?: (results: RollGroupResult[]) => void;
    onDieComplete?: (die: DieResult) => void;
  }

  export default DiceBox;
  export type { DiceBoxConfig, DieResult, RollGroupResult, RollOptions };
}
