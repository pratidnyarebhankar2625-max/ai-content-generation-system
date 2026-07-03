import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Navbar() {
  return (
    <nav className="h-16 border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary"></div>

          <h1 className="text-lg font-semibold tracking-tight text-primary">
            AI Content Studio
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Button variant="ghost">Templates</Button>

          <Button variant="ghost">History</Button>

          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              PR
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}