import type { AccessScope, Role } from "@/types/knight";

export type AccessContext = {
  role: Role;
  scope: AccessScope;
  readOnly: boolean;
  label: string;
};

export const playerReadOnlyAccess: AccessContext = {
  role: "PLAYER",
  scope: "READ_ONLY",
  readOnly: true,
  label: "Joueur - lecture seule"
};

export const adminAccess: AccessContext = {
  role: "ADMIN",
  scope: "EDIT",
  readOnly: false,
  label: "Administrateur"
};

export function canEdit(access: AccessContext) {
  return access.role === "ADMIN" && access.scope === "EDIT";
}
