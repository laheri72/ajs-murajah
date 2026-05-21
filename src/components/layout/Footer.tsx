import { Github } from "lucide-react";
import { cn } from "../../lib/utils";

type FooterProps = {
  className?: string;
};

const currentYear = new Date().getFullYear();

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t border-border bg-white/95", className)}>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 px-4 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:gap-3 sm:text-sm">
        <span>
          &copy; {currentYear} <strong className="font-semibold text-foreground">Marol_Tahfeez</strong> All rights reserved.
        </span>
        <span className="hidden text-border sm:inline">|</span>
        <span>
          Maintained by{" "}
          <a
            href="https://github.com/laheri72/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-teal-700 transition hover:text-teal-800"
          >
            <Github className="h-4 w-4" />
            Laheri72
          </a>
        </span>
      </div>
    </footer>
  );
}