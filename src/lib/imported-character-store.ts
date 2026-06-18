import type { ImportedKnightCharacter } from "@/types/knight";

export const IMPORTED_CHARACTER_STORAGE_KEY = "knight-companion:imported-character";
export const IMPORTED_CHARACTERS_STORAGE_KEY = "knight-companion:imported-characters";
export const LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY = "knight-companion:latest-imported-character-id";

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
  const rawRecords = window.sessionStorage.getItem(IMPORTED_CHARACTERS_STORAGE_KEY);

  if (!rawRecords) {
    return {};
  }

  try {
    return JSON.parse(rawRecords) as Record<string, ImportedKnightCharacter>;
  } catch (error) {
    console.error("[Foundry Import] Impossible de relire la liste des personnages importés", error);
    window.sessionStorage.removeItem(IMPORTED_CHARACTERS_STORAGE_KEY);
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

  window.sessionStorage.setItem(IMPORTED_CHARACTERS_STORAGE_KEY, JSON.stringify(records));
  window.sessionStorage.setItem(LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY, record.id);
  window.sessionStorage.setItem(IMPORTED_CHARACTER_STORAGE_KEY, JSON.stringify(record));
}

export function updateImportedCharacterPortrait(
  id: string,
  portrait: {
    url: string;
    fileName: string;
    mimeType: string;
  }
) {
  const records = readImportedCharacterMap();
  const record = records[id];

  if (!record) {
    console.error("[Portrait Import] Personnage importé introuvable pour la mise à jour du portrait", { id });
    return null;
  }

  const updatedRecord: ImportedKnightCharacter = {
    ...record,
    actor: {
      ...record.actor,
      img: portrait.url
    },
    character: {
      ...record.character,
      portraitUrl: portrait.url
    },
    portraitFileName: portrait.fileName,
    portraitMimeType: portrait.mimeType,
    portraitUpdatedAt: new Date().toISOString()
  };

  records[id] = updatedRecord;

  window.sessionStorage.setItem(IMPORTED_CHARACTERS_STORAGE_KEY, JSON.stringify(records));
  window.sessionStorage.setItem(LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY, id);
  window.sessionStorage.setItem(IMPORTED_CHARACTER_STORAGE_KEY, JSON.stringify(updatedRecord));

  return updatedRecord;
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
  const latestImportedCharacterId = window.sessionStorage.getItem(LATEST_IMPORTED_CHARACTER_ID_STORAGE_KEY);

  if (latestImportedCharacterId) {
    return readImportedCharacterById(latestImportedCharacterId);
  }

  const rawRecord = window.sessionStorage.getItem(IMPORTED_CHARACTER_STORAGE_KEY);

  if (!rawRecord) {
    return null;
  }

  try {
    const record = JSON.parse(rawRecord) as Partial<ImportedKnightCharacter>;

    if (!record.id) {
      console.error("[Foundry Import] Dernier import incompatible avec la route personnage actuelle", record);
      window.sessionStorage.removeItem(IMPORTED_CHARACTER_STORAGE_KEY);
      return null;
    }

    return record as ImportedKnightCharacter;
  } catch (error) {
    console.error("[Foundry Import] Impossible de relire le personnage importé", error);
    window.sessionStorage.removeItem(IMPORTED_CHARACTER_STORAGE_KEY);
    return null;
  }
}
