import type {
  EquipmentItem,
  EvolutionEntry,
  KnightCharacter,
  MetaArmor,
  ProgressionBlock
} from "@/types/knight";

export const mockCharacter: KnightCharacter = {
  id: "char-ariane",
  name: "Ariane Delorme",
  codename: "Sillage",
  playerName: "Camille",
  archetype: "Chevalier tacticien",
  rank: "Banneret",
  order: "Section Lyon",
  quote: "On ne gagne pas contre l'Anathème avec du courage seul.",
  biography:
    "Ancienne logisticienne de crise, Ariane coordonne les frappes rapides et maintient son escouade soudée quand la nuit gagne du terrain.",
  health: { current: 13, max: 16 },
  energy: { current: 8, max: 12 },
  hope: { current: 5, max: 7 },
  trauma: { current: 1, max: 5 },
  attributes: [
    { key: "force", label: "Force", value: 3 },
    { key: "agilite", label: "Agilité", value: 4 },
    { key: "esprit", label: "Esprit", value: 5 },
    { key: "aura", label: "Aura", value: 3 }
  ],
  skills: [
    { key: "combat", label: "Combat", value: 2, attribute: "Force" },
    { key: "tir", label: "Tir", value: 4, attribute: "Agilité" },
    { key: "technique", label: "Technique", value: 3, attribute: "Esprit" },
    { key: "sang-froid", label: "Sang-froid", value: 3, attribute: "Esprit" },
    { key: "commandement", label: "Commandement", value: 2, attribute: "Aura" }
  ]
};

export const mockMetaArmor: MetaArmor = {
  id: "armor-sillage",
  name: "Paladin M-12",
  frame: "Méta-armure polyvalente",
  generation: "Génération 4",
  armorPoints: { current: 18, max: 22 },
  shieldPoints: { current: 9, max: 12 },
  overdrive: { current: 2, max: 5 },
  slots: [
    { key: "main", label: "Bras principal", occupiedBy: "Lance magnétique" },
    { key: "secondary", label: "Bras secondaire", occupiedBy: "Bouclier cinétique" },
    { key: "back", label: "Module dorsal", occupiedBy: "Propulseurs courts" },
    { key: "core", label: "Coeur", occupiedBy: "Noyau tactique" }
  ],
  systems: [
    {
      id: "sys-targeting",
      name: "Assistance de visée",
      status: "online",
      description: "Verrouillage stable sur cibles rapides."
    },
    {
      id: "sys-armor",
      name: "Plaques réactives",
      status: "limited",
      description: "Deux plaques demandent une maintenance avant la prochaine sortie."
    },
    {
      id: "sys-comms",
      name: "Canal escouade",
      status: "online",
      description: "Chiffrement actif avec relais local."
    }
  ]
};

export const mockEquipment: EquipmentItem[] = [
  {
    id: "eq-lance",
    name: "Lance magnétique",
    slot: "weapon",
    quantity: 1,
    equipped: true,
    tags: ["Contact", "Percée", "Méta-armure"],
    description: "Arme principale pour engager les créatures massives à courte portée."
  },
  {
    id: "eq-pistol",
    name: "Pistolet lourd solaire",
    slot: "weapon",
    quantity: 1,
    equipped: true,
    tags: ["Distance", "Lumière"],
    description: "Arme de secours quand la ligne de front se brise."
  },
  {
    id: "eq-drone",
    name: "Drone éclaireur",
    slot: "module",
    quantity: 2,
    equipped: false,
    tags: ["Reconnaissance", "Soutien"],
    description: "Micro-drone utilisé pour cartographier les zones contaminées."
  },
  {
    id: "eq-medkit",
    name: "Kit de stabilisation",
    slot: "consumable",
    quantity: 3,
    equipped: false,
    tags: ["Soin", "Terrain"],
    description: "Permet de maintenir un allié conscient jusqu'à extraction."
  }
];

export const mockProgressionBlocks: ProgressionBlock[] = [
  {
    id: "prog-force-1",
    title: "+1 Force",
    category: "attribut",
    bonusValue: 1,
    costXp: 6,
    status: "available",
    note: "Disponible après deux missions de front."
  },
  {
    id: "prog-tir-1",
    title: "+1 Tir",
    category: "competence",
    bonusValue: 1,
    costXp: 4,
    status: "spent",
    note: "Dépensé après l'opération Verre Noir."
  },
  {
    id: "prog-shield-1",
    title: "+1 Bouclier",
    category: "armure",
    bonusValue: 1,
    costXp: 5,
    status: "available",
    note: "Nécessite une scène de maintenance."
  },
  {
    id: "prog-hope-1",
    title: "+1 Espoir",
    category: "ressource",
    bonusValue: 1,
    costXp: 7,
    status: "locked",
    note: "Verrouillé jusqu'au prochain jalon narratif."
  }
];

export const mockEvolutionEntries: EvolutionEntry[] = [
  {
    id: "evo-001",
    date: "2048-03-11",
    title: "Tir +1",
    kind: "skill",
    description: "Entraînement intensif au tir mobile après l'opération Verre Noir.",
    xpCost: 4
  },
  {
    id: "evo-002",
    date: "2048-03-18",
    title: "Noyau tactique installé",
    kind: "armor",
    description: "Amélioration de la méta-armure pour mieux coordonner l'escouade.",
    xpCost: 5
  },
  {
    id: "evo-003",
    date: "À planifier",
    title: "Force +1",
    kind: "attribute",
    description: "Bloc de progression prêt, en attente de validation administrateur.",
    xpCost: 6
  }
];
