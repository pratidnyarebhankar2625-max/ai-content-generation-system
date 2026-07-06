import { Button } from "@/components/ui/button";

export default function WelcomeSection() {
  return (
    <section className="mb-10 flex items-center justify-between">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, Pratidnya 👋
        </h1>

        <p className="max-w-2xl text-lg text-muted-foreground">
          Create amazing AI content faster with your personal AI assistant.
        </p>
      </div>

      <Button
        size="lg"
        className="rounded-xl px-6 shadow-sm"
      >
        + Create Content
      </Button>
    </section>
  );
}