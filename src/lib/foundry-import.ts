import type { FoundryKnightActor, KnightCharacterDraft } from "@/types/knight";

function readRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readNestedValue(source: Record<string, unknown>, key: string) {
  const entry = readRecord(source[key]);
  return entry.value;
}

export function isFoundryKnightActor(input: unknown): input is FoundryKnightActor {
  const actor = readRecord(input);
  return typeof actor.name === "string" && typeof actor.type === "string";
}

export function normalizeFoundryKnightActor(actor: FoundryKnightActor): KnightCharacterDraft {
  const system = readRecord(actor.system);
  const attributes = readRecord(system.attributes);
  const skills = readRecord(system.skills);

  return {
    name: actor.name,
    codename: readString(system.codename),
    archetype: readString(system.archetype),
    rank: readString(system.rank, "Écuyer"),
    rawFoundryActorId: actor._id,
    attributes: [
      { key: "force", label: "Force", value: readNumber(readNestedValue(attributes, "force"), 1) },
      { key: "agilite", label: "Agilité", value: readNumber(readNestedValue(attributes, "agilite"), 1) },
      { key: "esprit", label: "Esprit", value: readNumber(readNestedValue(attributes, "esprit"), 1) },
      { key: "aura", label: "Aura", value: readNumber(readNestedValue(attributes, "aura"), 1) }
    ],
    skills: [
      { key: "combat", label: "Combat", value: readNumber(readNestedValue(skills, "combat"), 0), attribute: "Force" },
      { key: "tir", label: "Tir", value: readNumber(readNestedValue(skills, "tir"), 0), attribute: "Agilité" },
      { key: "technique", label: "Technique", value: readNumber(readNestedValue(skills, "technique"), 0), attribute: "Esprit" },
      { key: "influence", label: "Influence", value: readNumber(readNestedValue(skills, "influence"), 0), attribute: "Aura" }
    ]
  };
}
