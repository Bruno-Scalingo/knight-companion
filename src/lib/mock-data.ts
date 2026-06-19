import type {
  EquipmentItem,
  KnightCharacter,
  MetaArmor,
  ProgressionBlock
} from "@/types/knight";

export const mockCharacter: KnightCharacter = {
  id: "char-ariane",
  name: "Ariane Delorme",
  callsign: "Sillage",
  age: "34 ans",
  codename: "Sillage",
  playerName: "Camille",
  archetype: "Chevalier tacticien",
  section: "Section Lyon",
  blazon: "Écu d'argent barré d'un sillage noir",
  blazonDetail:
    "Sillage porte un blason de coordination: une marque donnée aux chevaliers qui tiennent une ligne de repli sous pression.",
  feat: "Extraction de Verre Noir",
  rank: "Banneret",
  order: "Section Lyon",
  quote: "On ne gagne pas contre l'Anathème avec du courage seul.",
  biography:
    "Ancienne logisticienne de crise, Ariane coordonne les frappes rapides et maintient son escouade soudée quand la nuit gagne du terrain.",
  description:
    "Silhouette nerveuse, voix basse, regard toujours posé sur les issues. Ariane donne l'impression de calculer trois retraites possibles avant chaque entrée dans une pièce.",
  history:
    "Ancienne logisticienne de crise, Ariane a été recrutée après avoir tenu une zone d'évacuation isolée pendant trente-six heures.",
  motivations: "Ramener tout le monde vivant, même quand le plan initial s'effondre.",
  primaryMotivation: "Ramener tout le monde vivant.",
  secondaryMotivations: ["Ne jamais abandonner une escouade isolée", "Prouver que la méthode sauve autant que le courage"],
  languages: ["Français", "Anglais", "Codes opérationnels Knight"],
  distinctions: ["Citation de Verre Noir", "Ruban de coordination d'escouade"],
  health: { current: 13, max: 16 },
  hope: { current: 5, max: 7 },
  heroism: { current: 2, max: 6 },
  aegis: 2,
  defense: 8,
  reaction: 5,
  energy: { current: 8, max: 12 },
  trauma: { current: 1, max: 5 },
  aspectGroups: [
    {
      key: "chair",
      label: "Chair",
      value: 4,
      characteristics: [
        { key: "force", label: "Force", value: 3 },
        { key: "endurance", label: "Endurance", value: 4 },
        { key: "combat", label: "Combat", value: 2 }
      ]
    },
    {
      key: "bete",
      label: "Bête",
      value: 3,
      characteristics: [
        { key: "instinct", label: "Instinct", value: 3 },
        { key: "agilite", label: "Agilité", value: 4 },
        { key: "survie", label: "Survie", value: 2 }
      ]
    },
    {
      key: "machine",
      label: "Machine",
      value: 3,
      characteristics: [
        { key: "technique", label: "Technique", value: 3 },
        { key: "tir", label: "Tir", value: 4 },
        { key: "savoir", label: "Savoir", value: 3 }
      ]
    },
    {
      key: "dame",
      label: "Dame",
      value: 2,
      characteristics: [
        { key: "aura", label: "Aura", value: 3 },
        { key: "parole", label: "Parole", value: 2 },
        { key: "art", label: "Art", value: 1 }
      ]
    },
    {
      key: "masque",
      label: "Masque",
      value: 4,
      characteristics: [
        { key: "discretion", label: "Discrétion", value: 4 },
        { key: "mensonge", label: "Mensonge", value: 2 },
        { key: "sang-froid", label: "Sang-froid", value: 3 }
      ]
    }
  ],
  aspects: [
    { key: "dominant", label: "Dominant", value: "Stratège calme" },
    { key: "faille", label: "Faille", value: "Refuse de laisser quelqu'un derrière elle" }
  ],
  characteristics: [
    { key: "chair", label: "Chair", value: 4 },
    { key: "machine", label: "Machine", value: 3 }
  ],
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
  imageUrl: "/meta-armors/paladin-r.png",
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
  ],
  evolutions: [
    {
      id: "armor-evolution-150",
      threshold: 150,
      description: "Première évolution débloquée pour la méta-armure.",
      applied: true
    },
    {
      id: "armor-evolution-200",
      threshold: 200,
      description: "Deuxième évolution débloquée pour la méta-armure.",
      applied: false
    },
    {
      id: "armor-evolution-250",
      threshold: 250,
      description: "Troisième évolution débloquée pour la méta-armure.",
      applied: false
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
    pointsLabel: "XP",
    status: "locked",
    note: "Verrouillé jusqu'au prochain jalon narratif."
  }
];

export const mockEvolutionProgressionBlocks: ProgressionBlock[] = [
  {
    id: "evo-prog-001",
    title: "Reprise Wingsuit",
    category: "armure",
    bonusValue: 1,
    costXp: 10,
    pointsLabel: "PG",
    status: "spent",
    note: "Dépense de gloire liée à la reprise du Wingsuit."
  },
  {
    id: "evo-prog-002",
    title: "Conversion PA en Shotguns",
    category: "armure",
    bonusValue: 1,
    costXp: 25,
    pointsLabel: "PG",
    status: "spent",
    note: "Dépense de gloire liée à l'évolution de l'armement."
  },
  {
    id: "evo-prog-003",
    title: "Conversion Bouclier en Pavois",
    category: "armure",
    bonusValue: 1,
    costXp: 25,
    pointsLabel: "PG",
    status: "spent",
    note: "Dépense de gloire liée à la configuration défensive."
  }
];
