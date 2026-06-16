import type { Route } from "next";
import { redirect } from "next/navigation";

const defaultEvolutionRoute = "/personnages/char-ariane/evolution" as Route;

export default function EvolutionPage() {
  redirect(defaultEvolutionRoute);
}
