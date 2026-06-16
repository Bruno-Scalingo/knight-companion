import type { Route } from "next";
import { redirect } from "next/navigation";

const defaultEquipmentRoute = "/personnages/char-ariane/equipement" as Route;

export default function EquipmentPage() {
  redirect(defaultEquipmentRoute);
}
