import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function WelcomeSection() {
  return (
    <section className="animate-fade-in-up">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] p-10 shadow-[var(--shadow-elevated)]">
        {/* Decorative gold accent */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4A843]/10 blur-3xl" />
        <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-[#B8860B]/8 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-[#FAF8F5]">
              Welcome back, Pratidnya 👋
            </h1>

            <p className="max-w-2xl text-lg text-[#87817B]">
              Create amazing AI content faster with your personal AI assistant.
            </p>
          </div>

          <Button
            size="lg"
            className="rounded-2xl bg-gradient-to-r from-[#D4A843] to-[#B8860B] px-8 py-3 text-[#1C1917] font-semibold shadow-lg shadow-[#D4A843]/20 transition-all duration-400 hover:shadow-xl hover:shadow-[#D4A843]/30 hover:scale-[1.03]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Create Content
          </Button>
        </div>
      </div>
    </section>
  );
}