import { Trophy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold" data-testid="text-site-title">
                NPT
              </h1>
              <p className="text-xs text-muted-foreground">
                Norfolk Poker Tour
              </p>
            </div>
          </div>
          <Link href="/admin/login">
            <Button variant="ghost" data-testid="button-admin-link">
              Admin
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
