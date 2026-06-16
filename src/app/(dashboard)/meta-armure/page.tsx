import type { Route } from "next";
import { redirect } from "next/navigation";

const defaultMetaArmorRoute = "/personnages/char-ariane/meta-armure" as Route;

export default function MetaArmorPage() {
  redirect(defaultMetaArmorRoute);
}
