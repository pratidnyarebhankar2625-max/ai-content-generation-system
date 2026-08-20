
import GenerateWorkspace from "@/components/features/generate/GenerateWorkspace";

// The Page props format for Next.js App Router dynamic routes
export default async function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-10 h-full overflow-y-auto">
      <GenerateWorkspace templateId={id} />
    </div>
  );
}
