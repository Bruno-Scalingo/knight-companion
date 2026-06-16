import type { ImportedKnightCharacter } from "@/types/knight";

export const IMPORTED_CHARACTER_STORAGE_KEY = "knight-companion:imported-character";

export function saveImportedCharacter(record: ImportedKnightCharacter) {
  window.sessionStorage.setItem(IMPORTED_CHARACTER_STORAGE_KEY, JSON.stringify(record));
}

export function readImportedCharacter(): ImportedKnightCharacter | null {
  const rawRecord = window.sessionStorage.getItem(IMPORTED_CHARACTER_STORAGE_KEY);

  if (!rawRecord) {
    return null;
  }

  try {
    return JSON.parse(rawRecord) as ImportedKnightCharacter;
  } catch (error) {
    console.error("[Foundry Import] Impossible de relire le personnage importé", error);
    window.sessionStorage.removeItem(IMPORTED_CHARACTER_STORAGE_KEY);
    return null;
  }
}
