import type { Route } from "next";
import { redirect } from "next/navigation";

const defaultProgressionRoute = "/personnages/char-ariane/progression" as Route;

export default function ProgressionPage() {
  redirect(defaultProgressionRoute);
}
