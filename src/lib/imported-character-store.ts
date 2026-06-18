import type { ImportedKnightCharacter } from "@/types/knight";

export const IMPORTED_CHARACTER_STORAGE_KEY = "knight-companion:imported-character";
export const IMPORTED_CHARACTERS_STORAGE_KEY = "knight-companion:imported-characters";
export const LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY = "knight-companion:latest-imported-character-id";

function readStorageValue(key: string) {
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

function writeStorageValue(key: string, value: string) {
  window.localStorage.setItem(key, value);
  window.sessionStorage.setItem(key, value);
}

function removeStorageValue(key: string) {
  window.localStorage.removeItem(key);
  window.sessionStorage.removeItem(key);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readImportedCharacterMap(): Record<string, ImportedKnightCharacter> {
  const rawRecords = readStorageValue(IMPORTED_CHARACTERS_STORAGE_KEY);

  if (!rawRecords) {
    return {};
  }

  try {
    const records = JSON.parse(rawRecords) as Record<string, ImportedKnightCharacter>;
    window.localStorage.setItem(IMPORTED_CHARACTERS_STORAGE_KEY, JSON.stringify(records));
    return records;
  } catch (error) {
    console.error("[Foundry Import] Impossible de relire la liste des personnages importés", error);
    removeStorageValue(IMPORTED_CHARACTERS_STORAGE_KEY);
    return {};
  }
}

export function createImportedCharacterId(actorId: string | undefined, actorName: string, callsign?: string) {
  const source =
    callsign && callsign.trim().length > 0
      ? callsign
      : actorId && actorId.trim().length > 0
        ? actorId
        : actorName;
  const slug = slugify(source);

  return `foundry-${slug || Date.now().toString(36)}`;
}

export function saveImportedCharacter(record: ImportedKnightCharacter) {
  const records = readImportedCharacterMap();
  records[record.id] = record;

  writeStorageValue(IMPORTED_CHARACTERS_STORAGE_KEY, JSON.stringify(records));
  writeStorageValue(LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY, record.id);
  writeStorageValue(IMPORTED_CHARACTER_STORAGE_KEY, JSON.stringify(record));
}

export function readImportedCharacterById(id: string): ImportedKnightCharacter | null {
  const records = readImportedCharacterMap();
  const record = records[id] ?? null;

  if (!record) {
    console.error("[Foundry Import] Personnage importé introuvable", { id });
  }

  return record;
}

export function readImportedCharacter(): ImportedKnightCharacter | null {
  const latestImportedCharacterId = readStorageValue(LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY);

  if (latestImportedCharacterId) {
    return readImportedCharacterById(latestImportedCharacterId);
  }

  const rawRecord = readStorageValue(IMPORTED_CHARACTER_STORAGE_KEY);

  if (!rawRecord) {
    return null;
  }

  try {
    const record = JSON.parse(rawRecord) as Partial<ImportedKnightCharacter>;

    if (!record.id) {
      console.error("[Foundry Import] Dernier import incompatible avec la route personnage actuelle", record);
      removeStorageValue(IMPORTED_CHARACTER_STORAGE_KEY);
      return null;
    }

    window.localStorage.setItem(IMPORTED_CHARACTER_STORAGE_KEY, JSON.stringify(record));
    return record as ImportedKnightCharacter;
  } catch (error) {
    console.error("[Foundry Import] Impossible de relire le personnage importé", error);
    removeStorageValue(IMPORTED_CHARACTER_STORAGE_KEY);
    return null;
  }
}
