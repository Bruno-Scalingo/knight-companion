import type {
  AspectGroup,
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
import { decodeHtmlEntities } from "@/lib/html-entities";

const knightAspectLabels: Record<string, string> = {
  chair: "Chair",
  bete: "Bête",
  bête: "Bête",
  machine: "Machine",
  dame: "Dame",
  masque: "Masque"
};

const knightScoreLabels: Record<string, string> = {
  ...knightAspectLabels,
  deplacement: "Déplacement",
  force: "Force",
  endurance: "Endurance",
  hargne: "Hargne",
  combat: "Combat",
  instinct: "Instinct",
  tir: "Tir",
  savoir: "Savoir",
  technique: "Technique",
  aura: "Aura",
  parole: "Parole",
  sangFroid: "Sang-froid",
  discretion: "Discrétion",
  dexterite: "Dextérité",
  perception: "Perception"
};

const knightAspectKeys = new Set(["chair", "bete", "bête", "machine", "dame", "masque"]);

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? decodeHtmlEntities(value) : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function humanizeKey(key: string) {
  if (knightScoreLabels[key]) {
    return knightScoreLabels[key];
  }

  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
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
      return decodeHtmlEntities(value);
    }
  }

  return decodeHtmlEntities(fallback);
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

function pickFirstStringArray(source: Record<string, unknown>, paths: string[][]) {
  for (const path of paths) {
    const value = readPath(source, path);

    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (typeof entry === "string") {
            return decodeHtmlEntities(entry.trim());
          }

          const record = readRecord(entry);
          return decodeHtmlEntities(pickFirstString(record, [["label"], ["name"], ["title"], ["value"]]).trim());
        })
        .filter((entry) => entry.length > 0);
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return value
        .split(/[,;\n]/)
        .map((entry) => decodeHtmlEntities(entry.trim()))
        .filter((entry) => entry.length > 0);
    }
  }

  return [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => decodeHtmlEntities(value.trim())).filter((value) => value.length > 0)));
}

function parseItemNamesByType(items: Record<string, unknown>[], types: string[]) {
  const normalizedTypes = new Set(types.map((type) => type.toLowerCase()));

  return items
    .filter((item) => normalizedTypes.has(pickFirstString(item, [["type"]]).toLowerCase()))
    .map((item) => pickFirstString(item, [["name"]]))
    .filter((name) => name.length > 0);
}

function parseMotivationItems(items: Record<string, unknown>[]) {
  const motivationItems = items.filter(
    (item) => pickFirstString(item, [["type"]]).toLowerCase() === "motivationmineure"
  );
  const secondaryMotivations: string[] = [];
  let blazonDetail = "";

  for (const item of motivationItems) {
    const system = readRecord(item.system);
    const description = stripHtml(pickFirstString(system, [["description"]], pickFirstString(item, [["name"]])));

    if (description.length === 0) {
      continue;
    }

    if (/blason/i.test(description)) {
      blazonDetail = description;
      continue;
    }

    secondaryMotivations.push(description);
  }

  return {
    blazonDetail,
    secondaryMotivations: uniqueStrings(secondaryMotivations)
  };
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

function readGaugeAdjustment(record: Record<string, unknown>) {
  const bonus = pickFirstNumber(readRecord(record.bonus), [["user"], ["value"]], 0);
  const malus = pickFirstNumber(readRecord(record.malus), [["user"], ["value"]], 0);

  return bonus - malus;
}

function normalizeHealthGauge(record: Record<string, unknown>, fallbackCurrent = 0): Gauge {
  const current = pickFirstNumber(record, [["value"], ["current"]], fallbackCurrent);
  const adjustedCurrent = Math.max(0, current + readGaugeAdjustment(record));
  const explicitMax = pickFirstNumber(record, [["max"], ["base"]], 0);

  return {
    current: adjustedCurrent,
    max: explicitMax > 0 ? explicitMax + readGaugeAdjustment(record) : adjustedCurrent
  };
}

function normalizeHopeGauge(record: Record<string, unknown>, fallbackCurrent = 0): Gauge {
  const current = pickFirstNumber(record, [["value"], ["current"]], fallbackCurrent);
  const explicitMax = pickFirstNumber(record, [["max"], ["base"]], 0);
  const maxBonus = Math.trunc(readGaugeAdjustment(record) / 2);
  const computedMax = current + maxBonus;

  return {
    current,
    max: explicitMax > 0 ? explicitMax + maxBonus : Math.max(current, computedMax)
  };
}

function normalizeStaticScore(record: Record<string, unknown>, fallback = 0) {
  const base = pickFirstNumber(record, [["base"]], 0);
  const value = pickFirstNumber(record, [["value"], ["current"]], 0);
  const mod = pickFirstNumber(record, [["mod"]], 0);
  const score = base + value + mod + readGaugeAdjustment(record);

  return score > 0 ? score : fallback;
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

function parseKnightProgressionGains(source: Record<string, unknown>) {
  const progression = pickFirstRecord(source, [["progression", "experience", "depense", "liste"]]);
  const gains = new Map<string, number>();

  for (const value of Object.values(progression)) {
    const entry = readRecord(value);
    const key = pickFirstString(entry, [["nom"], ["caracteristique"]]).trim();

    if (key.length === 0) {
      continue;
    }

    gains.set(key, (gains.get(key) ?? 0) + pickFirstNumber(entry, [["bonus"]], 0));
  }

  return gains;
}

function readKnightScore(entry: Record<string, unknown>, progressionGain?: number) {
  const base = pickFirstNumber(entry, [["base"]], 0);
  const current = progressionGain ?? pickFirstNumber(entry, [["value"]], 0);
  const bonus = pickFirstNumber(readRecord(entry.bonus), [["user"], ["value"]], 0);
  const malus = pickFirstNumber(readRecord(entry.malus), [["user"], ["value"]], 0);
  const overdrive = pickFirstNumber(readRecord(entry.overdrive), [["value"]], 0);

  return base + current + bonus + overdrive - malus;
}

function parseKnightCharacteristics(source: Record<string, unknown>): CharacteristicEntry[] {
  const aspects = pickFirstRecord(source, [["aspects"]]);
  const progressionGains = parseKnightProgressionGains(source);

  return Object.entries(aspects).flatMap(([aspectKey, aspectValue]) => {
    const aspectRecord = readRecord(aspectValue);
    const characteristics = readRecord(aspectRecord.caracteristiques);

    return Object.entries(characteristics).map(([characteristicKey, characteristicValue]) => {
      const characteristicRecord = readRecord(characteristicValue);
      const progressionGain = progressionGains.has(characteristicKey)
        ? progressionGains.get(characteristicKey)
        : undefined;

      return {
        key: characteristicKey,
        label: `${humanizeKey(characteristicKey)} (${humanizeKey(aspectKey)})`,
        value: readKnightScore(characteristicRecord, progressionGain)
      };
    });
  });
}

function parseKnightAspectGroups(source: Record<string, unknown>): AspectGroup[] {
  const aspects = pickFirstRecord(source, [["aspects"]]);
  const progressionGains = parseKnightProgressionGains(source);

  return Object.entries(aspects).map(([aspectKey, aspectValue]) => {
    const aspectRecord = readRecord(aspectValue);
    const characteristics = readRecord(aspectRecord.caracteristiques);
    const normalizedAspectKey = aspectKey.toLowerCase();
    const aspectProgressionGain = progressionGains.has(aspectKey) ? progressionGains.get(aspectKey) : undefined;

    return {
      key: aspectKey,
      label: knightAspectLabels[normalizedAspectKey] ?? humanizeKey(aspectKey),
      value: readKnightScore(aspectRecord, aspectProgressionGain),
      characteristics: Object.entries(characteristics).map(([characteristicKey, characteristicValue]) => {
        const characteristicRecord = readRecord(characteristicValue);
        const characteristicProgressionGain = progressionGains.has(characteristicKey)
          ? progressionGains.get(characteristicKey)
          : undefined;

        return {
          key: `${aspectKey}-${characteristicKey}`,
          label: humanizeKey(characteristicKey),
          value: readKnightScore(characteristicRecord, characteristicProgressionGain)
        };
      })
    };
  });
}

function parseKnightAttributes(source: Record<string, unknown>) {
  const aspects = pickFirstRecord(source, [["aspects"]]);
  const progressionGains = parseKnightProgressionGains(source);

  return Object.entries(aspects).map(([key, value]) => {
    const entry = readRecord(value);
    const progressionGain = progressionGains.has(key) ? progressionGains.get(key) : undefined;

    return {
      key,
      label: humanizeKey(key),
      value: readKnightScore(entry, progressionGain)
    };
  });
}

function parseKnightSkills(source: Record<string, unknown>): SkillScore[] {
  const aspects = pickFirstRecord(source, [["aspects"]]);
  const progressionGains = parseKnightProgressionGains(source);

  return Object.entries(aspects).flatMap(([aspectKey, aspectValue]) => {
    const aspectRecord = readRecord(aspectValue);
    const characteristics = readRecord(aspectRecord.caracteristiques);

    return Object.entries(characteristics).map(([characteristicKey, characteristicValue]) => {
      const entry = readRecord(characteristicValue);
      const progressionGain = progressionGains.has(characteristicKey)
        ? progressionGains.get(characteristicKey)
        : undefined;

      return {
        key: characteristicKey,
        label: humanizeKey(characteristicKey),
        value: readKnightScore(entry, progressionGain),
        attribute: humanizeKey(aspectKey)
      };
    });
  });
}

function parseKnightProgression(source: Record<string, unknown>): ProgressionBlock[] {
  const progression = pickFirstRecord(source, [["progression", "experience", "depense", "liste"]]);

  return Object.entries(progression)
    .flatMap(([id, value], sourceIndex) => {
      const entry = readRecord(value);
      const key = pickFirstString(entry, [["nom"]], id);
      const totalBonus = Math.max(0, pickFirstNumber(entry, [["bonus"]], 0));
      const costXp = pickFirstNumber(entry, [["cout"]], 0);
      const sourceOrder = pickFirstNumber(entry, [["addOrder"]], sourceIndex);
      const category = knightAspectKeys.has(key.toLowerCase()) ? "aspect" : "competence";

      return Array.from({ length: totalBonus }, (_, unitIndex) => ({
        id: `progression-${id}-${unitIndex + 1}`,
        title: `+1 ${humanizeKey(key)}`,
        category,
        bonusValue: 1 as const,
        costXp: unitIndex === 0 ? costXp : 0,
        status: "spent" as const,
        note:
          totalBonus > 1
            ? `Bloc ${unitIndex + 1}/${totalBonus} issu de ${humanizeKey(key)} +${totalBonus}.`
            : `Bloc issu de ${humanizeKey(key)} +1.`,
        sourceId: id,
        sourceOrder,
        unitIndex: unitIndex + 1,
        unitTotal: totalBonus,
        sourceCostXp: costXp
      }));
    })
    .sort((first, second) => {
      const firstOrder = first.sourceOrder ?? 0;
      const secondOrder = second.sourceOrder ?? 0;

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return first.id.localeCompare(second.id);
    });
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
  const aegis = normalizeStaticScore(readRecord(system.egide));
  const aspectGroups = parseKnightAspectGroups(system);
  const aspects = parseKnightAspects(system);
  const characteristics = parseKnightCharacteristics(system);
  const attributes = parseKnightAttributes(system);
  const skills = parseKnightSkills(system);
  const progression = parseKnightProgression(system);
  const languages = uniqueStrings([
    ...pickFirstStringArray(system, [["langues"], ["languages"]]),
    ...parseItemNamesByType(items, ["langue"])
  ]);
  const distinctions = uniqueStrings([
    ...pickFirstStringArray(system, [["distinctions"], ["distinction"]]),
    ...parseItemNamesByType(items, ["distinction"])
  ]);
  const motivationItems = parseMotivationItems(items);
  const primaryMotivation = stripHtml(
    pickFirstString(system, [
      ["motivations", "majeure"],
      ["motivations", "principale"],
      ["motivation", "majeure"],
      ["motivationPrincipale"],
      ["drive"]
    ])
  );
  const equipment = items
    .filter((item) => {
      const type = pickFirstString(item, [["type"]]).toLowerCase();
      return ["arme", "module", "avantage", "inconvenient", "blessure", "distinction"].includes(type);
    })
    .map(normalizeEquipmentItem);

  return {
    name: actor.name,
    callsign: pickFirstString(system, [["surnom"], ["callsign"], ["codename"], ["alias"]]),
    portraitUrl: readString(actor.img),
    age: pickFirstString(system, [["age"], ["identite", "age"], ["identity", "age"]]),
    codename: pickFirstString(system, [["surnom"], ["codename"], ["callsign"], ["alias"]]),
    archetype: pickFirstString(system, [["archetype"], ["role"], ["class"]]),
    section: pickFirstString(system, [["section"], ["order"], ["organization"]]),
    blazon: pickFirstString(system, [["blason"], ["blazon"], ["armoiries"]]),
    blazonDetail: motivationItems.blazonDetail,
    feat: pickFirstString(system, [["hautFait"], ["haut-fait"], ["haut_fait"], ["feat"]]),
    rank: pickFirstString(system, [["rank"], ["grade"]], "Écuyer"),
    order: pickFirstString(system, [["section"], ["order"], ["organization"]]),
    quote: pickFirstString(system, [["quote"], ["citation"]]),
    biography: stripHtml(
      pickFirstString(system, [["histoire"], ["biography"], ["background"], ["history"], ["description"]])
    ),
    description: stripHtml(pickFirstString(system, [["description"], ["identite", "description"]])),
    history: stripHtml(pickFirstString(system, [["histoire"], ["history"], ["background"]])),
    motivations: uniqueStrings([primaryMotivation, ...motivationItems.secondaryMotivations]).join(" · "),
    primaryMotivation,
    secondaryMotivations: motivationItems.secondaryMotivations,
    languages,
    distinctions,
    health: normalizeHealthGauge(readRecord(system.sante)),
    hope: normalizeHopeGauge(readRecord(system.espoir)),
    heroism: normalizeFlatGauge(readRecord(system.heroisme)),
    aegis,
    defense: normalizeStaticScore(readRecord(system.defense), aegis),
    reaction: normalizeStaticScore(readRecord(system.reaction), aegis),
    energy: normalizeFlatGauge(readRecord(system.energie)),
    trauma: parseGauge(system, [["trauma"]], { current: 0, max: 0 }),
    aspectGroups,
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
