export type Role = "ADMIN" | "PLAYER";
export type AccessScope = "READ_ONLY" | "EDIT";

export type CharacterTabId =
  | "personnage"
  | "meta-armure"
  | "equipement"
  | "progression"
  | "evolution";

export type Gauge = {
  current: number;
  max: number;
};

export type AttributeScore = {
  key: string;
  label: string;
  value: number;
};

export type AspectEntry = {
  key: string;
  label: string;
  value: string;
};

export type CharacteristicEntry = {
  key: string;
  label: string;
  value: number | string;
  baseValue?: number | string;
  overdrive?: number;
};

export type AspectGroup = {
  key: string;
  label: string;
  value: number | string;
  baseValue?: number | string;
  characteristics: CharacteristicEntry[];
};

export type SkillScore = {
  key: string;
  label: string;
  value: number;
  attribute: string;
};

export type KnightCharacter = {
  id: string;
  name: string;
  callsign: string;
  portraitUrl?: string;
  age: string;
  codename: string;
  playerName: string;
  archetype: string;
  section: string;
  blazon: string;
  blazonDetail: string;
  feat: string;
  rank: string;
  order: string;
  quote: string;
  biography: string;
  description: string;
  history: string;
  motivations: string;
  primaryMotivation: string;
  secondaryMotivations: string[];
  languages: string[];
  distinctions: string[];
  health: Gauge;
  hope: Gauge;
  heroism: Gauge;
  aegis: number;
  defense: number;
  reaction: number;
  energy: Gauge;
  trauma: Gauge;
  aspectGroups?: AspectGroup[];
  aspects?: AspectEntry[];
  characteristics?: CharacteristicEntry[];
  attributes: AttributeScore[];
  skills: SkillScore[];
};

export type ArmorSlot = {
  key: string;
  label: string;
  available?: number;
  total?: number;
  occupiedBy?: string;
};

export type ArmorSystem = {
  id: string;
  name: string;
  status: "online" | "limited" | "offline";
  description: string;
};

export type ArmorEvolution = {
  id: string;
  threshold: number;
  description: string;
  applied: boolean;
};

export type MetaArmor = {
  id: string;
  name: string;
  frame: string;
  generation: string;
  imageUrl?: string;
  armorPoints: Gauge;
  shieldPoints: Gauge;
  overdrive: Gauge;
  slots: ArmorSlot[];
  systems: ArmorSystem[];
  evolutions: ArmorEvolution[];
};

export type EquipmentSlot = "weapon" | "armor" | "module" | "relic" | "consumable" | "other";

export type DiceRoll = {
  dice: number;
  fixe: number;
};

export type EquipmentItem = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  sourceType?: string;
  overdriveKey?: string;
  slotUsage?: string[];
  weaponType?: "contact" | "distance";
  range?: string;
  damage?: DiceRoll;
  violence?: DiceRoll;
  isOverdriveModule?: boolean;
  moduleType?: string;
  level?: number;
  quantity: number;
  equipped: boolean;
  tags: string[];
  description: string;
};

export type ProgressionBlock = {
  id: string;
  title: string;
  category: "aspect" | "attribut" | "competence" | "armure" | "ressource";
  bonusValue: 1;
  costXp: number;
  pointsLabel?: "XP" | "PG";
  status: "available" | "spent" | "locked";
  note: string;
  sourceId?: string;
  sourceOrder?: number;
  unitIndex?: number;
  unitTotal?: number;
  sourceCostXp?: number;
};

export type EvolutionEntry = {
  id: string;
  date: string;
  title: string;
  kind: "attribute" | "skill" | "armor" | "equipment" | "narrative";
  description: string;
  xpCost: number;
};

export type FoundryKnightActor = {
  _id?: string;
  img?: string;
  name: string;
  type: "knight";
  system?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
  flags?: Record<string, unknown>;
};

export type KnightCharacterDraft = {
  name: string;
  callsign?: string;
  availableXp?: number;
  availableGp?: number;
  portraitUrl?: string;
  age?: string;
  codename?: string;
  archetype?: string;
  section?: string;
  blazon?: string;
  blazonDetail?: string;
  feat?: string;
  rank?: string;
  order?: string;
  quote?: string;
  biography?: string;
  description?: string;
  history?: string;
  motivations?: string;
  primaryMotivation?: string;
  secondaryMotivations?: string[];
  languages?: string[];
  distinctions?: string[];
  health?: Gauge;
  hope?: Gauge;
  heroism?: Gauge;
  aegis?: number;
  defense?: number;
  reaction?: number;
  energy?: Gauge;
  trauma?: Gauge;
  aspectGroups?: AspectGroup[];
  aspects?: AspectEntry[];
  characteristics?: CharacteristicEntry[];
  metaArmor?: MetaArmor | null;
  equipment?: EquipmentItem[];
  progression?: ProgressionBlock[];
  evolutionProgression?: ProgressionBlock[];
  attributes: AttributeScore[];
  skills: SkillScore[];
  rawFoundryActorId?: string;
};

export type ImportedKnightCharacter = {
  id: string;
  importedAt: string;
  sourceFileName?: string;
  actor: FoundryKnightActor;
  character: KnightCharacterDraft;
};
