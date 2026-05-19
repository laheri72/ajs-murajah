import { Check, Lock, Minus, Plus } from "lucide-react";
import { RUB_UNITS } from "../../lib/quran";
import { cn } from "../../lib/utils";

export function RubGrid({
  completedRub,
  selectedRub,
  multiSelect,
  lockedJuz,
  lockedRub,
  savingRub,
  onRubClick,
}: {
  completedRub: number[];
  selectedRub: number[];
  multiSelect: boolean;
  lockedJuz: number[];
  lockedRub: number[];
  savingRub: number[];
  onRubClick: (rub: number) => void;
}) {
  const completed = new Set(completedRub);
  const selected = new Set(selectedRub);
  const locked = new Set(lockedJuz);
  const lockedUnits = new Set(lockedRub);
  const saving = new Set(savingRub);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 30 }, (_, juzIndex) => {
        const juzNumber = juzIndex + 1;
        const units = RUB_UNITS.filter((unit) => unit.juzNumber === juzNumber);
        const completedInJuz = units.filter((unit) => completed.has(unit.rubNumber)).length;
        const isLocked = locked.has(juzNumber);
        return (
          <section
            key={juzNumber}
            className={cn(
              "rounded-lg border bg-white p-3 transition",
              completedInJuz === 4 ? "border-emerald-200 bg-emerald-50/70" : "border-border",
              isLocked && "bg-muted/60 opacity-75",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">Juz {juzNumber}</p>
                  {isLocked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                </div>
                <p className="text-xs text-muted-foreground">{isLocked ? "Complete previous Juz to unlock" : `${completedInJuz}/4 complete`}</p>
              </div>
              <div className={cn("h-2 w-14 overflow-hidden rounded-full bg-muted", completedInJuz === 4 && "bg-emerald-100")}>
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completedInJuz * 25}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {units.map((unit) => {
                const isComplete = completed.has(unit.rubNumber);
                const isSelected = selected.has(unit.rubNumber);
                const isSelectedUndo = multiSelect && isSelected && isComplete;
                const isSaving = saving.has(unit.rubNumber);
                const isRubLocked = lockedUnits.has(unit.rubNumber);
                const isDisabled = isLocked || isRubLocked || isSaving;
                return (
                  <button
                    key={unit.rubNumber}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onRubClick(unit.rubNumber)}
                    className={cn(
                      "focus-ring relative flex aspect-square min-h-11 min-w-0 items-center justify-center rounded-md border text-sm font-bold transition active:scale-95",
                      isComplete
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary hover:bg-white",
                      multiSelect && isSelected && "border-gold bg-gold-soft text-foreground ring-2 ring-gold",
                      isSelectedUndo && "bg-red-50 text-red-700 ring-red-200",
                      (isLocked || isRubLocked) && "cursor-not-allowed border-border bg-muted text-muted-foreground hover:border-border hover:bg-muted",
                      isSaving && "cursor-wait opacity-80 ring-2 ring-primary/30",
                    )}
                    aria-pressed={isComplete || isSelected}
                    aria-disabled={isDisabled}
                    aria-label={`Juz ${unit.juzNumber}, Rub ${unit.rubInJuz}`}
                    title={isLocked ? `Juz ${juzNumber} is locked` : isRubLocked ? "Undo later Juz progress first" : `Rub ${unit.rubNumber}`}
                  >
                    {isSaving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : isSelectedUndo ? (
                      <Minus className="h-4 w-4" />
                    ) : isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : isSelected ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      unit.rubInJuz
                    )}
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
