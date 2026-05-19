export const TOTAL_JUZ = 30;
export const RUB_PER_JUZ = 4;
export const TOTAL_RUB = TOTAL_JUZ * RUB_PER_JUZ;

export type RubUnit = {
  rubNumber: number;
  juzNumber: number;
  rubInJuz: number;
};

export const RUB_UNITS: RubUnit[] = Array.from({ length: TOTAL_RUB }, (_, index) => {
  const rubNumber = index + 1;
  return {
    rubNumber,
    juzNumber: Math.floor(index / RUB_PER_JUZ) + 1,
    rubInJuz: (index % RUB_PER_JUZ) + 1,
  };
});

export function getCompletionPercentage(completed: number, target = TOTAL_RUB) {
  if (!target) return 0;
  return Math.min(100, (completed / target) * 100);
}
