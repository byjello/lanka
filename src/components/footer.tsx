import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-16 md:flex-row">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          Made with <Heart className="h-4 w-4 fill-current text-red-500" /> by{" "}
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 hover:text-primary"
          >
            Saif
          </a>
        </div>
      </div>
    </footer>
  );
}
