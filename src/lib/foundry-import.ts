import type {
  AspectEntry,
  CharacteristicEntry,
  EquipmentItem,
  FoundryKnightActor,
  Gauge,
  KnightCharacterDraft,
  MetaArmor
} from "@/types/knight";

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function readPath(source: Record<string, unknown>, path: string[]) {
  let current: unknown = source;

  for (const part of path) {
    current = readRecord(current)[part];
  }

  return current;
}

function pickFirstString(source: Record<string, unknown>, paths: string[][], fallback = "") {
  for (const path of paths) {
    const value = readPath(source, path);

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}

function pickFirstNumber(source: Record<string, unknown>, paths: string[][], fallback = 0) {
  for (const path of paths) {
    const value = readPath(source, path);

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

function pickFirstRecord(source: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = readPath(source, path);
    const record = readRecord(value);

    if (Object.keys(record).length > 0) {
      return record;
    }
  }

  return {};
}

function readCollectionValue(entry: unknown) {
  if (typeof entry === "string" || typeof entry === "number") {
    return entry;
  }

  const record = readRecord(entry);
  const candidate = [
    record.value,
    record.label,
    record.text,
    record.name,
    record.title,
    record.current,
    record.score
  ].find((value) => typeof value === "string" || typeof value === "number");

  return candidate;
}

function parseGauge(source: Record<string, unknown>, paths: string[][], fallback: Gauge): Gauge {
  const record = pickFirstRecord(source, paths);

  if (Object.keys(record).length === 0) {
    return fallback;
  }

  const current = pickFirstNumber(
    record,
    [["current"], ["value"], ["now"], ["used"], ["score"]],
    fallback.current
  );
  const max = pickFirstNumber(record, [["max"], ["maximum"], ["total"], ["limit"]], fallback.max);

  return {
    current,
    max: max > 0 ? max : fallback.max
  };
}

function parseTextEntries(source: Record<string, unknown>, paths: string[][]): AspectEntry[] {
  const record = pickFirstRecord(source, paths);

  return Object.entries(record)
    .map(([key, value]) => {
      const entryRecord = readRecord(value);
      const rawValue = readCollectionValue(value);
      const textValue = typeof rawValue === "string" ? rawValue.trim() : typeof rawValue === "number" ? String(rawValue) : "";

      return {
        key,
        label: pickFirstString(entryRecord, [["label"], ["name"], ["title"]], humanizeKey(key)),
        value: textValue
      };
    })
    .filter((entry) => entry.value.length > 0);
}

function parseCharacteristicEntries(source: Record<string, unknown>, paths: string[][]): CharacteristicEntry[] {
  const record = pickFirstRecord(source, paths);

  return Object.entries(record)
    .map(([key, value]) => {
      const entryRecord = readRecord(value);
      const rawValue = readCollectionValue(value);
      const normalizedValue =
        typeof rawValue === "number"
          ? rawValue
          : typeof rawValue === "string" && rawValue.trim().length > 0
            ? rawValue.trim()
            : null;

      return normalizedValue === null
        ? null
        : {
            key,
            label: pickFirstString(entryRecord, [["label"], ["name"], ["title"]], humanizeKey(key)),
            value: normalizedValue
          };
    })
    .filter((entry): entry is CharacteristicEntry => entry !== null);
}

function normalizeEquipmentItem(item: Record<string, unknown>, index: number): EquipmentItem {
  const system = readRecord(item.system);
  const descriptionRecord = readRecord(system.description);
  const tags = Array.isArray(system.tags)
    ? system.tags.filter((tag): tag is string => typeof tag === "string")
    : Array.isArray(system.traits)
      ? system.traits.filter((tag): tag is string => typeof tag === "string")
      : [];

  const rawType = pickFirstString(item, [["type"]], "other").toLowerCase();
  const slot: EquipmentItem["slot"] =
    rawType.includes("weapon") || rawType.includes("arme")
      ? "weapon"
      : rawType.includes("armor") || rawType.includes("armure")
        ? "armor"
        : rawType.includes("module")
          ? "module"
          : rawType.includes("relic") || rawType.includes("relique")
            ? "relic"
            : rawType.includes("consumable") || rawType.includes("consommable")
              ? "consumable"
              : "other";

  return {
    id: pickFirstString(item, [["_id"], ["id"]], `import-item-${index}`),
    name: pickFirstString(item, [["name"]], `Équipement ${index + 1}`),
    slot,
    quantity: pickFirstNumber(system, [["quantity"], ["qty"], ["count"]], 1),
    equipped: readBoolean(system.equipped, false) || readBoolean(readRecord(system.equipped).value, false),
    tags,
    description: pickFirstString(
      { descriptionRecord, system },
      [["descriptionRecord", "value"], ["descriptionRecord", "text"], ["system", "resume"], ["system", "summary"]],
      "Aucune description fournie."
    )
  };
}

function parseMetaArmor(source: Record<string, unknown>): MetaArmor | null {
  const metaArmor = pickFirstRecord(source, [
    ["metaArmor"],
    ["metaarmor"],
    ["armor"],
    ["armure"],
    ["mecha"],
    ["suit"]
  ]);

  if (Object.keys(metaArmor).length === 0) {
    return null;
  }

  return {
    id: pickFirstString(metaArmor, [["_id"], ["id"]], "import-meta-armor"),
    name: pickFirstString(metaArmor, [["name"], ["label"]], "Méta-armure importée"),
    frame: pickFirstString(metaArmor, [["frame"], ["chassis"], ["type"]], "Non renseigné"),
    generation: pickFirstString(metaArmor, [["generation"], ["gen"]], "Non renseignée"),
    armorPoints: parseGauge(metaArmor, [["armor"], ["armure"], ["resistance"]], { current: 0, max: 0 }),
    shieldPoints: parseGauge(metaArmor, [["shield"], ["bouclier"]], { current: 0, max: 0 }),
    overdrive: parseGauge(metaArmor, [["overdrive"], ["drive"]], { current: 0, max: 0 }),
    slots: Object.entries(pickFirstRecord(metaArmor, [["slots"], ["modules"], ["emplacements"]])).map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      occupiedBy: typeof readCollectionValue(value) === "string" ? String(readCollectionValue(value)) : undefined
    })),
    systems: Object.entries(pickFirstRecord(metaArmor, [["systems"], ["systemes"]])).map(([key, value], index) => {
      const entryRecord = readRecord(value);
      return {
        id: pickFirstString(entryRecord, [["_id"], ["id"]], `import-system-${index}`),
        name: pickFirstString(entryRecord, [["name"], ["label"]], humanizeKey(key)),
        status: "online" as const,
        description: pickFirstString(entryRecord, [["description"], ["text"], ["value"]], "Système importé.")
      };
    })
  };
}

export function isFoundryKnightActor(input: unknown): input is FoundryKnightActor {
  return validateFoundryKnightActor(input).valid;
}

export type FoundryActorValidationResult =
  | {
      valid: true;
      actor: FoundryKnightActor;
    }
  | {
      valid: false;
      message: string;
    };

export function validateFoundryKnightActor(input: unknown): FoundryActorValidationResult {
  const actor = readRecord(input);

  if (Object.keys(actor).length === 0) {
    return {
      valid: false,
      message: "Le fichier JSON doit contenir un objet Foundry Actor."
    };
  }

  if (typeof actor.name !== "string" || actor.name.trim().length === 0) {
    return {
      valid: false,
      message: 'Acteur Foundry invalide: le champ "name" est obligatoire.'
    };
  }

  if (actor.type !== "knight") {
    const receivedType = typeof actor.type === "string" ? actor.type : "absent";

    return {
      valid: false,
      message: `Acteur Foundry invalide: type "${receivedType}" reçu, type "knight" attendu.`
    };
  }

  return {
    valid: true,
    actor: input as FoundryKnightActor
  };
}

export function normalizeFoundryKnightActor(actor: FoundryKnightActor): KnightCharacterDraft {
  const system = readRecord(actor.system);
  const attributes = readRecord(system.attributes);
  const skills = readRecord(system.skills);
  const items = Array.isArray(actor.items) ? actor.items.map((item) => readRecord(item)) : [];
  const aspects = parseTextEntries(system, [
    ["aspects"],
    ["aspect"],
    ["traits"],
    ["descriptors"],
    ["bio", "aspects"],
    ["description", "aspects"]
  ]);
  const characteristics = parseCharacteristicEntries(system, [
    ["characteristics"],
    ["caracteristiques"],
    ["caracteristics"],
    ["characteristic"],
    ["attributes"]
  ]);

  return {
    name: actor.name,
    codename: pickFirstString(system, [["codename"], ["callsign"], ["alias"]]),
    archetype: pickFirstString(system, [["archetype"], ["role"], ["class"]]),
    rank: pickFirstString(system, [["rank"], ["grade"]], "Écuyer"),
    order: pickFirstString(system, [["order"], ["section"], ["organization"]]),
    quote: pickFirstString(system, [["quote"], ["citation"]]),
    biography: pickFirstString(system, [["biography"], ["background"], ["history"], ["description"]]),
    health: parseGauge(system, [["health"], ["hp"], ["sante"]], { current: 0, max: 0 }),
    energy: parseGauge(system, [["energy"], ["energie"]], { current: 0, max: 0 }),
    hope: parseGauge(system, [["hope"], ["espoir"]], { current: 0, max: 0 }),
    trauma: parseGauge(system, [["trauma"]], { current: 0, max: 0 }),
    aspects,
    characteristics,
    metaArmor: parseMetaArmor(system),
    equipment: items.map(normalizeEquipmentItem),
    rawFoundryActorId: actor._id,
    attributes: [
      { key: "force", label: "Force", value: pickFirstNumber(attributes, [["force", "value"], ["force"]], 1) },
      { key: "agilite", label: "Agilité", value: pickFirstNumber(attributes, [["agilite", "value"], ["agility", "value"], ["agilite"], ["agility"]], 1) },
      { key: "esprit", label: "Esprit", value: pickFirstNumber(attributes, [["esprit", "value"], ["spirit", "value"], ["esprit"], ["spirit"]], 1) },
      { key: "aura", label: "Aura", value: pickFirstNumber(attributes, [["aura", "value"], ["aura"]], 1) }
    ],
    skills: [
      { key: "combat", label: "Combat", value: pickFirstNumber(skills, [["combat", "value"], ["combat"]], 0), attribute: "Force" },
      { key: "tir", label: "Tir", value: pickFirstNumber(skills, [["tir", "value"], ["shoot", "value"], ["tir"], ["shoot"]], 0), attribute: "Agilité" },
      { key: "technique", label: "Technique", value: pickFirstNumber(skills, [["technique", "value"], ["tech", "value"], ["technique"], ["tech"]], 0), attribute: "Esprit" },
      { key: "influence", label: "Influence", value: pickFirstNumber(skills, [["influence", "value"], ["influence"]], 0), attribute: "Aura" }
    ]
  };
}
