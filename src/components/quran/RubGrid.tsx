import { Check } from "lucide-react";
import { RUB_UNITS } from "../../lib/quran";
import { cn } from "../../lib/utils";

export function RubGrid({
  completedRub,
  selectedRub,
  multiSelect,
  disabled,
  onRubClick,
}: {
  completedRub: number[];
  selectedRub: number[];
  multiSelect: boolean;
  disabled?: boolean;
  onRubClick: (rub: number) => void;
}) {
  const completed = new Set(completedRub);
  const selected = new Set(selectedRub);

  return (
    <div className="grid gap-3">
      {Array.from({ length: 30 }, (_, juzIndex) => {
        const juzNumber = juzIndex + 1;
        const units = RUB_UNITS.filter((unit) => unit.juzNumber === juzNumber);
        return (
          <section key={juzNumber} className="grid grid-cols-[48px_1fr] items-center gap-2 rounded-md border border-border bg-white p-2">
            <div className="text-sm font-semibold text-muted-foreground">Juz {juzNumber}</div>
            <div className="grid grid-cols-4 gap-2">
              {units.map((unit) => {
                const isComplete = completed.has(unit.rubNumber);
                const isSelected = selected.has(unit.rubNumber);
                return (
                  <button
                    key={unit.rubNumber}
                    type="button"
                    disabled={disabled}
                    onClick={() => onRubClick(unit.rubNumber)}
                    className={cn(
                      "focus-ring flex h-11 min-w-0 items-center justify-center rounded-md border text-sm font-semibold transition active:scale-95",
                      isComplete
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-background text-muted-foreground hover:border-primary",
                      multiSelect && isSelected && "border-gold bg-gold-soft text-foreground ring-2 ring-gold",
                    )}
                    aria-pressed={isComplete || isSelected}
                    title={`Rub ${unit.rubNumber}`}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : unit.rubInJuz}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
