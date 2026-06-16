import type {
  AspectEntry,
  CharacteristicEntry,
  EquipmentItem,
  FoundryKnightActor,
  Gauge,
  KnightCharacterDraft,
  MetaArmor,
  ProgressionBlock,
  SkillScore
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

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
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

function normalizeFlatGauge(record: Record<string, unknown>, fallbackCurrent = 0): Gauge {
  const current = pickFirstNumber(record, [["value"], ["current"]], fallbackCurrent);
  const explicitMax = pickFirstNumber(record, [["max"], ["base"]], 0);

  return {
    current,
    max: explicitMax > 0 ? explicitMax : Math.max(current, fallbackCurrent)
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

function parseKnightAspects(source: Record<string, unknown>): AspectEntry[] {
  const aspects = pickFirstRecord(source, [["aspects"]]);

  return Object.entries(aspects).map(([key, value]) => {
    const entry = readRecord(value);
    const description = pickFirstString(entry, [["description"]]);
    const summary = [`Base ${pickFirstNumber(entry, [["base"]], 0)}`, `Actuel ${pickFirstNumber(entry, [["value"]], 0)}`];

    return {
      key,
      label: humanizeKey(key),
      value: description ? `${summary.join(" · ")} · ${stripHtml(description)}` : summary.join(" · ")
    };
  });
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

function parseKnightCharacteristics(source: Record<string, unknown>): CharacteristicEntry[] {
  const aspects = pickFirstRecord(source, [["aspects"]]);

  return Object.entries(aspects).flatMap(([aspectKey, aspectValue]) => {
    const aspectRecord = readRecord(aspectValue);
    const characteristics = readRecord(aspectRecord.caracteristiques);

    return Object.entries(characteristics).map(([characteristicKey, characteristicValue]) => {
      const characteristicRecord = readRecord(characteristicValue);
      const base = pickFirstNumber(characteristicRecord, [["base"]], 0);
      const bonus = pickFirstNumber(readRecord(characteristicRecord.bonus), [["user"]], 0);
      const malus = pickFirstNumber(readRecord(characteristicRecord.malus), [["user"]], 0);
      const current = pickFirstNumber(characteristicRecord, [["value"]], 0);
      const total = base + current + bonus - malus;

      return {
        key: characteristicKey,
        label: `${humanizeKey(characteristicKey)} (${humanizeKey(aspectKey)})`,
        value: total
      };
    });
  });
}

function parseKnightAttributes(source: Record<string, unknown>) {
  const aspects = pickFirstRecord(source, [["aspects"]]);

  return Object.entries(aspects).map(([key, value]) => {
    const entry = readRecord(value);
    return {
      key,
      label: humanizeKey(key),
      value: pickFirstNumber(entry, [["base"]], 0) + pickFirstNumber(entry, [["value"]], 0)
    };
  });
}

function parseKnightSkills(source: Record<string, unknown>): SkillScore[] {
  const aspects = pickFirstRecord(source, [["aspects"]]);

  return Object.entries(aspects).flatMap(([aspectKey, aspectValue]) => {
    const aspectRecord = readRecord(aspectValue);
    const characteristics = readRecord(aspectRecord.caracteristiques);

    return Object.entries(characteristics).map(([characteristicKey, characteristicValue]) => {
      const entry = readRecord(characteristicValue);
      const overdrive = pickFirstNumber(readRecord(entry.overdrive), [["value"]], 0);
      const bonus = pickFirstNumber(readRecord(entry.bonus), [["user"]], 0);
      const malus = pickFirstNumber(readRecord(entry.malus), [["user"]], 0);
      const total = pickFirstNumber(entry, [["base"]], 0) + pickFirstNumber(entry, [["value"]], 0) + overdrive + bonus - malus;

      return {
        key: characteristicKey,
        label: humanizeKey(characteristicKey),
        value: total,
        attribute: humanizeKey(aspectKey)
      };
    });
  });
}

function parseKnightProgression(source: Record<string, unknown>): ProgressionBlock[] {
  const progression = pickFirstRecord(source, [["progression", "experience", "depense", "liste"]]);

  return Object.entries(progression)
    .map(([id, value]) => {
      const entry = readRecord(value);
      const displayBonusValue = Math.max(1, pickFirstNumber(entry, [["bonus"]], 1));

      return {
        id: `progression-${id}`,
        title: `+${displayBonusValue} ${humanizeKey(pickFirstString(entry, [["nom"]], id))}`,
        category: "competence" as const,
        bonusValue: 1 as const,
        costXp: pickFirstNumber(entry, [["cout"]], 0),
        status: "spent" as const,
        note: `Achat Foundry: ${pickFirstString(entry, [["nom"]], id)} (+${displayBonusValue})`
      };
    })
    .filter((entry) => entry.costXp > 0);
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
    description: stripHtml(
      pickFirstString(
      { descriptionRecord, system },
      [["descriptionRecord", "value"], ["descriptionRecord", "text"], ["system", "resume"], ["system", "summary"]],
      "Aucune description fournie."
      )
    )
  };
}

function parseMetaArmorFromItems(items: Record<string, unknown>[], system: Record<string, unknown>): MetaArmor | null {
  const armorItem = items.find((item) => pickFirstString(item, [["type"]]).toLowerCase() === "armure");

  if (!armorItem) {
    return null;
  }

  const metaArmor = readRecord(armorItem.system);
  const capacities = readRecord(metaArmor.capacites);
  const selectedCapacities = readRecord(capacities.selected);
  const slots = readRecord(metaArmor.slots);

  return {
    id: pickFirstString(armorItem, [["_id"], ["id"]], "import-meta-armor"),
    name: pickFirstString(armorItem, [["name"]], "Méta-armure importée"),
    frame: pickFirstString(metaArmor, [["description"]], "Non renseigné"),
    generation: String(pickFirstNumber(metaArmor, [["generation"]], 0) || "Non renseignée"),
    armorPoints: {
      current: pickFirstNumber(system, [["armure", "value"]], 0),
      max: pickFirstNumber(metaArmor, [["armure", "base"]], 0)
    },
    shieldPoints: {
      current: pickFirstNumber(system, [["champDeForce", "value"]], 0),
      max: pickFirstNumber(metaArmor, [["champDeForce", "base"]], 0)
    },
    overdrive: {
      current: pickFirstNumber(system, [["flux", "value"]], 0),
      max: 0
    },
    slots: Object.entries(slots).map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      occupiedBy: `Slots ${pickFirstNumber(readRecord(value), [["value"]], 0)}`
    })),
    systems: Object.entries(selectedCapacities).map(([key, value], index) => {
      const entryRecord = readRecord(value);
      return {
        id: `import-system-${index}`,
        name: pickFirstString(entryRecord, [["label"]], humanizeKey(key)),
        status: "online" as const,
        description: stripHtml(pickFirstString(entryRecord, [["description"]], "Système importé."))
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
  const items = Array.isArray(actor.items) ? actor.items.map((item) => readRecord(item)) : [];
  const aspects = parseKnightAspects(system);
  const characteristics = parseKnightCharacteristics(system);
  const attributes = parseKnightAttributes(system);
  const skills = parseKnightSkills(system);
  const progression = parseKnightProgression(system);
  const equipment = items
    .filter((item) => {
      const type = pickFirstString(item, [["type"]]).toLowerCase();
      return ["arme", "module", "avantage", "inconvenient", "blessure", "distinction"].includes(type);
    })
    .map(normalizeEquipmentItem);

  return {
    name: actor.name,
    codename: pickFirstString(system, [["surnom"], ["codename"], ["callsign"], ["alias"]]),
    archetype: pickFirstString(system, [["archetype"], ["role"], ["class"]]),
    rank: pickFirstString(system, [["rank"], ["grade"]], "Écuyer"),
    order: pickFirstString(system, [["section"], ["order"], ["organization"]]),
    quote: pickFirstString(system, [["quote"], ["citation"]]),
    biography: stripHtml(
      pickFirstString(system, [["histoire"], ["biography"], ["background"], ["history"], ["description"]])
    ),
    health: normalizeFlatGauge(readRecord(system.sante)),
    energy: normalizeFlatGauge(readRecord(system.energie)),
    hope: normalizeFlatGauge(readRecord(system.espoir)),
    trauma: parseGauge(system, [["trauma"]], { current: 0, max: 0 }),
    aspects,
    characteristics,
    metaArmor: parseMetaArmorFromItems(items, system),
    equipment,
    progression,
    rawFoundryActorId: actor._id,
    attributes,
    skills
  };
}
