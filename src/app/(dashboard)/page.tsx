import type { Route } from "next";
import { redirect } from "next/navigation";

const defaultCharacterRoute = "/personnages/char-ariane" as Route;

export default function DashboardPage() {
  redirect(defaultCharacterRoute);
}
