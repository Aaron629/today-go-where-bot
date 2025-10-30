export const runtime = "edge";
import type { Metadata } from "next";
import RouletteClient from "./client";

export const metadata: Metadata = {
  title: "三餐輪盤｜今天去哪兒",
  description: "早餐、午晚餐、手搖飲的隨機決定輪盤。",
};

type SearchParams = { meal?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;  // ✅ 這裡一定要是 Promise
}) {
  const params = await searchParams;    // ✅ 先解 Promise
  const raw = (params?.meal ?? "main").toLowerCase();

  const meal =
    raw === "breakfast" || raw === "drink"
      ? (raw as "breakfast" | "drink")
      : "main";

  return <RouletteClient meal={meal} />;
}
