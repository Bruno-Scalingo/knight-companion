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
  codename: string;
  playerName: string;
  archetype: string;
  rank: string;
  order: string;
  quote: string;
  biography: string;
  health: Gauge;
  energy: Gauge;
  hope: Gauge;
  trauma: Gauge;
  aspects?: AspectEntry[];
  characteristics?: CharacteristicEntry[];
  attributes: AttributeScore[];
  skills: SkillScore[];
};

export type ArmorSlot = {
  key: string;
  label: string;
  occupiedBy?: string;
};

export type ArmorSystem = {
  id: string;
  name: string;
  status: "online" | "limited" | "offline";
  description: string;
};

export type MetaArmor = {
  id: string;
  name: string;
  frame: string;
  generation: string;
  armorPoints: Gauge;
  shieldPoints: Gauge;
  overdrive: Gauge;
  slots: ArmorSlot[];
  systems: ArmorSystem[];
};

export type EquipmentSlot = "weapon" | "armor" | "module" | "relic" | "consumable" | "other";

export type EquipmentItem = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quantity: number;
  equipped: boolean;
  tags: string[];
  description: string;
};

export type ProgressionBlock = {
  id: string;
  title: string;
  category: "attribut" | "competence" | "armure" | "ressource";
  bonusValue: 1;
  costXp: number;
  status: "available" | "spent" | "locked";
  note: string;
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
  name: string;
  type: "knight";
  system?: Record<string, unknown>;
  items?: Array<Record<string, unknown>>;
  flags?: Record<string, unknown>;
};

export type KnightCharacterDraft = {
  name: string;
  codename?: string;
  archetype?: string;
  rank?: string;
  order?: string;
  quote?: string;
  biography?: string;
  health?: Gauge;
  energy?: Gauge;
  hope?: Gauge;
  trauma?: Gauge;
  aspects?: AspectEntry[];
  characteristics?: CharacteristicEntry[];
  metaArmor?: MetaArmor | null;
  equipment?: EquipmentItem[];
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
