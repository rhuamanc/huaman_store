import HomePageClient from "@/components/HomePageClient";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;

  return (
    <HomePageClient
      initialQuery={params.q || ""}
      initialCategory={params.category || "Todas"}
    />
  );
}
