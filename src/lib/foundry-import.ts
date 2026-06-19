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

function isAppPortraitUrl(value: string) {
  return (
    value.startsWith("data:image/") ||
    value.startsWith("/portraits/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
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
  const adjustment = readGaugeAdjustment(record);
  const mod = pickFirstNumber(record, [["mod"]], 0);
  const adjustedCurrent = Math.max(0, current + adjustment);
  const explicitMax = pickFirstNumber(record, [["max"], ["base"]], 0);
  const adjustedMax = explicitMax > 0 ? explicitMax + mod + adjustment : adjustedCurrent;

  return {
    current: adjustedCurrent,
    max: Math.max(0, adjustedMax)
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

  return base + current + bonus - malus;
}

function readKnightBaseScore(entry: Record<string, unknown>) {
  return pickFirstNumber(entry, [["base"]], 0);
}

function readKnightOverdrive(entry: Record<string, unknown>) {
  return Math.max(0, pickFirstNumber(entry, [["overdrive", "value"]], 0));
}

function addOverdriveGain(gains: Map<string, number>, key: string, value: number) {
  if (key.length === 0 || value <= 0) {
    return;
  }

  gains.set(key, (gains.get(key) ?? 0) + value);
}

function addArmorOverdrives(gains: Map<string, number>, overdrives: Record<string, unknown>) {
  for (const aspectValue of Object.values(overdrives)) {
    const characteristicList = readRecord(readRecord(aspectValue).liste);

    for (const [characteristicKey, characteristicValue] of Object.entries(characteristicList)) {
      addOverdriveGain(gains, characteristicKey, pickFirstNumber(readRecord(characteristicValue), [["value"]], 0));
    }
  }
}

function addModuleLevelOverdrives(gains: Map<string, number>, moduleSystem: Record<string, unknown>) {
  const level = pickFirstNumber(moduleSystem, [["niveau", "value"]], 0);
  const levelDetails = readRecord(readRecord(readRecord(moduleSystem.niveau).details)[`n${level}`]);
  const overdriveAspects = readRecord(readRecord(levelDetails.overdrives).aspects);

  for (const aspectValue of Object.values(overdriveAspects)) {
    for (const [characteristicKey, characteristicValue] of Object.entries(readRecord(aspectValue))) {
      addOverdriveGain(gains, characteristicKey, readNumber(characteristicValue));
    }
  }
}

function parseKnightOverdriveGains(items: Record<string, unknown>[]) {
  const gains = new Map<string, number>();

  for (const item of items) {
    const system = readRecord(item.system);
    const type = pickFirstString(item, [["type"]]).toLowerCase();
    const armorOverdrives = readRecord(system.overdrives);

    if (Object.keys(armorOverdrives).length > 0) {
      addArmorOverdrives(gains, armorOverdrives);
    }

    if (type === "module") {
      addModuleLevelOverdrives(gains, system);
    }
  }

  return gains;
}

function readCharacteristicOverdrive(
  characteristicKey: string,
  characteristicRecord: Record<string, unknown>,
  overdriveGains: Map<string, number>
) {
  return readKnightOverdrive(characteristicRecord) + (overdriveGains.get(characteristicKey) ?? 0);
}

function parseKnightCharacteristics(
  source: Record<string, unknown>,
  overdriveGains = new Map<string, number>()
): CharacteristicEntry[] {
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
        value: readKnightScore(characteristicRecord, progressionGain),
        baseValue: readKnightBaseScore(characteristicRecord),
        overdrive: readCharacteristicOverdrive(characteristicKey, characteristicRecord, overdriveGains)
      };
    });
  });
}

function parseKnightAspectGroups(source: Record<string, unknown>, overdriveGains = new Map<string, number>()): AspectGroup[] {
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
      baseValue: readKnightBaseScore(aspectRecord),
      characteristics: Object.entries(characteristics).map(([characteristicKey, characteristicValue]) => {
        const characteristicRecord = readRecord(characteristicValue);
        const characteristicProgressionGain = progressionGains.has(characteristicKey)
          ? progressionGains.get(characteristicKey)
          : undefined;

        return {
          key: `${aspectKey}-${characteristicKey}`,
          label: humanizeKey(characteristicKey),
          value: readKnightScore(characteristicRecord, characteristicProgressionGain),
          baseValue: readKnightBaseScore(characteristicRecord),
          overdrive: readCharacteristicOverdrive(characteristicKey, characteristicRecord, overdriveGains)
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

function normalizeLookupKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function inferKnownPortraitUrl(actorName: string, callsign: string) {
  const lookup = normalizeLookupKey(`${actorName} ${callsign}`);

  if (lookup.includes("lars") && lookup.includes("aegis")) {
    return "/portraits/lars-aegis-sverker.png";
  }

  return "";
}

function resolvePortraitUrl(actor: FoundryKnightActor, callsign: string) {
  const importedPortraitUrl = readString(actor.img);

  if (isAppPortraitUrl(importedPortraitUrl)) {
    return importedPortraitUrl;
  }

  return inferKnownPortraitUrl(actor.name, callsign) || importedPortraitUrl;
}

function calculateHighestCharacteristicScore(
  characteristics: CharacteristicEntry[],
  keys: string[],
  fallback = 0
) {
  const wantedKeys = new Set(keys.map(normalizeLookupKey));
  const matchingScores = characteristics
    .filter((characteristic) => wantedKeys.has(normalizeLookupKey(characteristic.key)))
    .map((characteristic) => characteristic.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return matchingScores.length > 0 ? Math.max(...matchingScores) : fallback;
}

function parseKnightProgression(source: Record<string, unknown>): ProgressionBlock[] {
  const progression = pickFirstRecord(source, [["progression", "experience", "depense", "liste"]]);

  return Object.entries(progression)
    .flatMap(([id, value], sourceIndex) => {
      const entry = readRecord(value);
      const key = pickFirstString(entry, [["nom"]], id);
      const normalizedKey = key.toLowerCase();
      const totalBonus = Math.max(0, pickFirstNumber(entry, [["bonus"]], 0));
      const costXp = pickFirstNumber(entry, [["cout"]], 0);
      const sourceOrder = pickFirstNumber(entry, [["addOrder"]], sourceIndex);
      const blockCount = totalBonus > 0 ? totalBonus : costXp > 0 ? 1 : 0;
      const category: ProgressionBlock["category"] = knightAspectKeys.has(normalizedKey)
        ? "aspect"
        : normalizedKey === "autre" || normalizedKey === "other"
          ? "ressource"
          : "competence";

      return Array.from({ length: blockCount }, (_, unitIndex) => ({
        id: `progression-${id}-${unitIndex + 1}`,
        title: totalBonus > 0 ? `+1 ${humanizeKey(key)}` : humanizeKey(key),
        category,
        bonusValue: 1 as const,
        costXp: unitIndex === 0 ? costXp : 0,
        pointsLabel: "XP" as const,
        status: "spent" as const,
        note:
          totalBonus > 1
            ? `Bloc ${unitIndex + 1}/${totalBonus} issu de ${humanizeKey(key)} +${totalBonus}.`
            : totalBonus === 1
              ? `Bloc issu de ${humanizeKey(key)} +1.`
              : `Dépense d'expérience liée à ${humanizeKey(key)}.`,
        sourceId: id,
        sourceOrder,
        unitIndex: totalBonus > 1 ? unitIndex + 1 : undefined,
        unitTotal: totalBonus > 1 ? totalBonus : undefined,
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

function parseKnightAvailableXp(source: Record<string, unknown>) {
  const experience = pickFirstRecord(source, [["progression", "experience"]]);
  const progression = pickFirstRecord(source, [["progression", "experience", "depense", "liste"]]);
  const totalXp = pickFirstNumber(experience, [["total"]], 0);
  const spentXp = Object.values(progression).reduce<number>((sum, value) => {
    const entry = readRecord(value);
    return sum + Math.max(0, pickFirstNumber(entry, [["cout"]], 0));
  }, 0);

  return Math.max(0, totalXp - spentXp);
}

function readModuleCurrentLevel(system: Record<string, unknown>) {
  return pickFirstNumber(system, [["niveau", "value"]], 0);
}

function readModuleLevelDetails(system: Record<string, unknown>, level: number) {
  return readRecord(readRecord(readRecord(system.niveau).details)[`n${level}`]);
}

function readModuleCurrentLevelDetails(system: Record<string, unknown>) {
  const currentLevel = readModuleCurrentLevel(system);

  return readModuleLevelDetails(system, currentLevel);
}

function readItemGloryCost(item: Record<string, unknown>) {
  const type = pickFirstString(item, [["type"]]).toLowerCase();
  const system = readRecord(item.system);

  if (type === "module") {
    const currentLevel = Math.max(0, Math.trunc(readModuleCurrentLevel(system)));

    return Array.from({ length: currentLevel }, (_, index) => index + 1).reduce((sum, level) => {
      return sum + Math.max(0, pickFirstNumber(readModuleLevelDetails(system, level), [["prix"]], 0));
    }, 0);
  }

  if (type === "arme") {
    return Math.max(0, pickFirstNumber(system, [["prix"]], 0));
  }

  return 0;
}

function formatItemEvolutionTitle(item: Record<string, unknown>) {
  const type = pickFirstString(item, [["type"]]).toLowerCase();
  const system = readRecord(item.system);
  const name = pickFirstString(item, [["name"]], "Évolution importée");

  if (type === "armure") {
    return `Méta-armure: ${name}`;
  }

  if (type === "module") {
    const currentLevel = readModuleCurrentLevel(system);
    return currentLevel > 0 ? `${name} niveau ${currentLevel}` : name;
  }

  return name;
}

function parseKnightGloryProgression(source: Record<string, unknown>, items: Record<string, unknown>[]): ProgressionBlock[] {
  const gloryList = pickFirstRecord(source, [["progression", "gloire", "depense", "liste"]]);
  const gloryOther = pickFirstRecord(source, [["progression", "gloire", "depense", "autre"]]);
  const entries = [
    ...items
      .filter((item) => ["armure", "arme", "module"].includes(pickFirstString(item, [["type"]]).toLowerCase()))
      .map((item, sourceIndex) => ({ item, sourceIndex, source: "item" as const })),
    ...Object.entries(gloryList).map(([id, value], sourceIndex) => ({
      id,
      value,
      sourceIndex: items.length + sourceIndex,
      source: "liste" as const
    })),
    ...Object.entries(gloryOther).map(([id, value], sourceIndex) => ({
      id,
      value,
      sourceIndex: items.length + Object.keys(gloryList).length + sourceIndex,
      source: "autre" as const
    }))
  ];

  return entries
    .flatMap((entry) => {
      if (entry.source === "item") {
        const itemId = pickFirstString(entry.item, [["_id"], ["id"]], `${entry.sourceIndex}`);
        const itemType = pickFirstString(entry.item, [["type"]], "item");
        const itemName = pickFirstString(entry.item, [["name"]], "Évolution importée");
        const costGp = readItemGloryCost(entry.item);
        const sourceOrder = entry.sourceIndex;

        return [
          {
            id: `evolution-item-${itemId}`,
            title: formatItemEvolutionTitle(entry.item),
            category: "armure" as const,
            bonusValue: 1 as const,
            costXp: costGp,
            pointsLabel: "PG" as const,
            status: "spent" as const,
            note: `Progression Foundry liée à ${itemType} ${itemName}.`,
            sourceId: `item-${itemId}`,
            sourceOrder,
            sourceCostXp: costGp > 0 ? costGp : undefined
          }
        ];
      }

      const gloryEntry = readRecord(entry.value);
      const key = pickFirstString(gloryEntry, [["nom"]], entry.id);
      const totalBonus = Math.max(0, pickFirstNumber(gloryEntry, [["bonus"]], 0));
      const signedCostGp = pickFirstNumber(gloryEntry, [["cout"]], 0);
      const rawCostGp = Math.abs(signedCostGp);
      const costGp = entry.source === "autre" ? signedCostGp : rawCostGp;
      const sourceOrder = pickFirstNumber(gloryEntry, [["addOrder"], ["order"]], entry.sourceIndex);
      const blockCount = totalBonus > 0 ? totalBonus : costGp > 0 ? 1 : 0;
      const fallbackBlockCount = entry.source === "autre" && rawCostGp > 0 ? 1 : blockCount;

      return Array.from({ length: fallbackBlockCount }, (_, unitIndex) => ({
        id: `evolution-${entry.source}-${entry.id}-${unitIndex + 1}`,
        title: totalBonus > 0 ? `+1 ${humanizeKey(key)}` : key,
        category: "armure" as const,
        bonusValue: 1 as const,
        costXp: unitIndex === 0 ? costGp : 0,
        pointsLabel: "PG" as const,
        status: "spent" as const,
        note:
          totalBonus > 1
            ? `Bloc ${unitIndex + 1}/${totalBonus} issu de ${humanizeKey(key)} +${totalBonus}.`
            : totalBonus === 1
              ? `Bloc issu de ${humanizeKey(key)} +1.`
              : entry.source === "autre"
                ? `Ajustement de gloire lié à ${key}.`
                : `Dépense de gloire liée à ${key}.`,
        sourceId: `${entry.source}-${entry.id}`,
        sourceOrder,
        unitIndex: totalBonus > 1 ? unitIndex + 1 : undefined,
        unitTotal: totalBonus > 1 ? totalBonus : undefined,
        sourceCostXp: signedCostGp !== 0 ? signedCostGp : undefined
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

function parseKnightAvailableGp(source: Record<string, unknown>, items: Record<string, unknown>[]) {
  const glory = pickFirstRecord(source, [["progression", "gloire"]]);
  const gloryList = pickFirstRecord(source, [["progression", "gloire", "depense", "liste"]]);
  const gloryOther = pickFirstRecord(source, [["progression", "gloire", "depense", "autre"]]);
  const totalGp = pickFirstNumber(glory, [["total"]], 0);
  const itemSpentGp = items.reduce<number>((sum, item) => sum + readItemGloryCost(item), 0);
  const listSpentGp = Object.values(gloryList).reduce<number>((sum, value) => {
    const entry = readRecord(value);
    return sum + Math.abs(pickFirstNumber(entry, [["cout"]], 0));
  }, 0);
  const signedAdjustmentsGp = Object.values(gloryOther).reduce<number>((sum, value) => {
    const entry = readRecord(value);
    return sum + pickFirstNumber(entry, [["cout"]], 0);
  }, 0);
  const spentGp = itemSpentGp + listSpentGp + signedAdjustmentsGp;

  return Math.max(0, totalGp - spentGp);
}

function normalizeEquipmentItem(item: Record<string, unknown>, index: number): EquipmentItem {
  const system = readRecord(item.system);
  const descriptionRecord = readRecord(system.description);
  const slotRecord = readRecord(system.slots);
  const rawType = pickFirstString(item, [["type"]], "other").toLowerCase();
  const currentLevel = readModuleCurrentLevel(system);
  const currentLevelDetails = readModuleCurrentLevelDetails(system);
  const tags = Array.isArray(system.tags)
    ? system.tags.filter((tag): tag is string => typeof tag === "string")
    : Array.isArray(system.traits)
      ? system.traits.filter((tag): tag is string => typeof tag === "string")
      : [];

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
  const slotUsage =
    rawType === "module"
      ? Object.entries(slotRecord)
          .map(([key, value]) => ({
            key,
            value: readNumber(value)
          }))
          .filter((entry) => entry.value > 0)
          .map((entry) => `${humanizeKey(entry.key)} ${entry.value}`)
      : [];

  return {
    id: pickFirstString(item, [["_id"], ["id"]], `import-item-${index}`),
    name: pickFirstString(item, [["name"]], `Équipement ${index + 1}`),
    slot,
    sourceType: rawType,
    overdriveKey:
      rawType === "module" && readBoolean(readRecord(currentLevelDetails.overdrives).has, false)
        ? pickFirstString(item, [["name"]]).trim().toLowerCase()
        : undefined,
    weaponType:
      rawType === "arme" && pickFirstString(system, [["type"]]).toLowerCase() === "contact"
        ? "contact"
        : rawType === "arme" && pickFirstString(system, [["type"]]).toLowerCase() === "distance"
          ? "distance"
          : undefined,
    range: pickFirstString(system, [["portee"], ["portée"], ["range"]]),
    isOverdriveModule:
      rawType === "module" && readBoolean(readRecord(currentLevelDetails.overdrives).has, false),
    moduleType: rawType === "module" ? pickFirstString(system, [["categorie"], ["category"]]) : undefined,
    slotUsage,
    level: rawType === "module" ? currentLevel : undefined,
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

function parseArmorOverdriveEquipmentItems(items: Record<string, unknown>[]): EquipmentItem[] {
  const armorItem = items.find((item) => pickFirstString(item, [["type"]]).toLowerCase() === "armure");

  if (!armorItem) {
    return [];
  }

  const armorSystem = readRecord(armorItem.system);
  const armorOverdrives = readRecord(armorSystem.overdrives);
  const armorName = pickFirstString(armorItem, [["name"]], "Méta-armure importée");
  const result: EquipmentItem[] = [];

  for (const aspectValue of Object.values(armorOverdrives)) {
    const characteristicList = readRecord(readRecord(aspectValue).liste);

    for (const [characteristicKey, characteristicValue] of Object.entries(characteristicList)) {
      const overdriveValue = pickFirstNumber(readRecord(characteristicValue), [["value"]], 0);

      if (overdriveValue <= 0) {
        continue;
      }

      result.push({
        id: `armor-overdrive-${characteristicKey}`,
        name: humanizeKey(characteristicKey),
        slot: "module",
        sourceType: "module",
        overdriveKey: characteristicKey.toLowerCase(),
        isOverdriveModule: true,
        moduleType: "Overdrive",
        level: overdriveValue,
        quantity: 1,
        equipped: true,
        tags: ["Méta-armure", "Overdrive d'origine"],
        description: `Overdrive natif de ${armorName}.`
      });
    }
  }

  return result;
}

function isEmptyWeaponTemplateItem(item: Record<string, unknown>) {
  const system = readRecord(item.system);
  const type = pickFirstString(item, [["type"]]).toLowerCase();
  const name = pickFirstString(item, [["name"]]).trim().toLowerCase();
  const description = stripHtml(pickFirstString(system, [["description"]]));
  const damageDice = pickFirstNumber(system, [["degats", "dice"]], 0);
  const damageFixed = pickFirstNumber(system, [["degats", "fixe"]], 0);
  const violenceDice = pickFirstNumber(system, [["violence", "dice"]], 0);
  const violenceFixed = pickFirstNumber(system, [["violence", "fixe"]], 0);
  const effects = readRecord(system.effets);
  const rawEffects = Array.isArray(effects.raw) ? effects.raw : [];
  const customEffects = Array.isArray(effects.custom) ? effects.custom : [];

  return (
    type === "arme" &&
    name === "arme" &&
    description.length === 0 &&
    damageDice === 0 &&
    damageFixed === 0 &&
    violenceDice === 0 &&
    violenceFixed === 0 &&
    rawEffects.length === 0 &&
    customEffects.length === 0
  );
}

function readModuleBonusAtCurrentLevel(
  items: Record<string, unknown>[],
  bonusKey: "champDeForce" | "armure",
) {
  let total = 0;

  for (const item of items) {
    if (pickFirstString(item, [["type"]]).toLowerCase() !== "module") {
      continue;
    }

    const system = readRecord(item.system);
    const level = pickFirstNumber(system, [["niveau", "value"]], 0);
    const details = readRecord(readRecord(system.niveau).details);
    const levelEntry = readRecord(details[`n${level}`]);
    const bonus = readRecord(levelEntry.bonus);

    if (readBoolean(readRecord(bonus[bonusKey]).has)) {
      total += pickFirstNumber(readRecord(bonus[bonusKey]), [["value"]], 0);
    }
  }

  return total;
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
  const armorEvolutions = readRecord(metaArmor.evolutions);
  const evolutionList = readRecord(armorEvolutions.liste);
  const moduleSlotUsage = {
    tete: 0,
    torse: 0,
    brasGauche: 0,
    brasDroit: 0,
    jambeGauche: 0,
    jambeDroite: 0
  };
  const armorName = pickFirstString(armorItem, [["name"]], "Méta-armure importée");
  const imageUrl = /paladin/i.test(armorName) ? "/meta-armors/paladin-r.png" : undefined;
  const armorBonus = readModuleBonusAtCurrentLevel(items, "armure");
  const shieldBonus = readModuleBonusAtCurrentLevel(items, "champDeForce");

  for (const item of items) {
    if (pickFirstString(item, [["type"]]).toLowerCase() !== "module") {
      continue;
    }

    const moduleSlots = readRecord(readRecord(item.system).slots);

    for (const slotKey of Object.keys(moduleSlotUsage) as Array<keyof typeof moduleSlotUsage>) {
      moduleSlotUsage[slotKey] += pickFirstNumber(moduleSlots, [[slotKey]], 0);
    }
  }

  return {
    id: pickFirstString(armorItem, [["_id"], ["id"]], "import-meta-armor"),
    name: armorName,
    frame: pickFirstString(metaArmor, [["description"]], "Non renseigné"),
    generation: String(pickFirstNumber(metaArmor, [["generation"]], 0) || "Non renseignée"),
    imageUrl,
    armorPoints: {
      current: pickFirstNumber(system, [["armure", "value"]], 0),
      max: pickFirstNumber(metaArmor, [["armure", "base"]], 0) + armorBonus
    },
    shieldPoints: {
      current: pickFirstNumber(system, [["champDeForce", "value"]], 0),
      max: pickFirstNumber(metaArmor, [["champDeForce", "base"]], 0) + shieldBonus
    },
    overdrive: {
      current: pickFirstNumber(system, [["flux", "value"]], 0),
      max: 0
    },
    slots: Object.entries(slots).map(([key, value]) => {
      const total = pickFirstNumber(readRecord(value), [["value"]], 0);
      const usage = moduleSlotUsage[key as keyof typeof moduleSlotUsage] ?? 0;
      const available = Math.max(0, total - usage);

      return {
        key,
        label: humanizeKey(key),
        available,
        total
      };
    }),
    systems: Object.entries(selectedCapacities).map(([key, value], index) => {
      const entryRecord = readRecord(value);
      return {
        id: `import-system-${index}`,
        name: pickFirstString(entryRecord, [["label"]], humanizeKey(key)),
        status: "online" as const,
        description: stripHtml(pickFirstString(entryRecord, [["description"]], "Système importé."))
      };
    }),
    evolutions: Object.entries(evolutionList).map(([key, value]) => {
      const evolution = readRecord(value);

      return {
        id: `import-evolution-${key}`,
        threshold: pickFirstNumber(evolution, [["value"]], 0),
        description: stripHtml(pickFirstString(evolution, [["description"]], "Évolution de méta-armure.")),
        applied: readBoolean(evolution.applied)
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
  const overdriveGains = parseKnightOverdriveGains(items);
  const aspectGroups = parseKnightAspectGroups(system, overdriveGains);
  const aspects = parseKnightAspects(system);
  const characteristics = parseKnightCharacteristics(system, overdriveGains);
  const attributes = parseKnightAttributes(system);
  const skills = parseKnightSkills(system);
  const progression = parseKnightProgression(system);
  const defense = calculateHighestCharacteristicScore(
    characteristics,
    ["hargne", "combat", "instinct"],
    normalizeStaticScore(readRecord(system.defense), aegis)
  );
  const reaction = calculateHighestCharacteristicScore(
    characteristics,
    ["tir", "savoir", "technique"],
    normalizeStaticScore(readRecord(system.reaction), aegis)
  );
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
      if (isEmptyWeaponTemplateItem(item)) {
        return false;
      }

      const type = pickFirstString(item, [["type"]]).toLowerCase();
      return [
        "arme",
        "module",
        "avantage",
        "inconvenient",
        "désavantage",
        "desavantage",
        "blessure",
        "distinction"
      ].includes(type);
    })
    .map(normalizeEquipmentItem);
  const armorOverdriveEquipment = parseArmorOverdriveEquipmentItems(items);

  const callsign = pickFirstString(system, [["surnom"], ["callsign"], ["codename"], ["alias"]]);
  const importedHeroism = normalizeFlatGauge(readRecord(system.heroisme));

  return {
    name: actor.name,
    callsign,
    availableXp: parseKnightAvailableXp(system),
    availableGp: parseKnightAvailableGp(system, items),
    portraitUrl: resolvePortraitUrl(actor, callsign),
    age: pickFirstString(system, [["age"], ["identite", "age"], ["identity", "age"]]),
    codename: callsign || pickFirstString(system, [["codename"], ["callsign"], ["alias"]]),
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
    heroism: {
      current: Math.min(importedHeroism.current, 6),
      max: 6
    },
    aegis,
    defense,
    reaction,
    energy: normalizeFlatGauge(readRecord(system.energie)),
    trauma: parseGauge(system, [["trauma"]], { current: 0, max: 0 }),
    aspectGroups,
    aspects,
    characteristics,
    metaArmor: parseMetaArmorFromItems(items, system),
    equipment: [...equipment, ...armorOverdriveEquipment],
    progression,
    evolutionProgression: parseKnightGloryProgression(system, items),
    rawFoundryActorId: actor._id,
    attributes,
    skills
  };
}
