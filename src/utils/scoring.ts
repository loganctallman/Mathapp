export function computeSlowIndices(
  answeredAt: (number | null)[],
  start: number
): Set<number> {
  const timed = answeredAt
    .map((t, i) => ({ t: t ?? 0, i }))
    .filter(({ t }) => t > 0)
    .sort((a, b) => a.t - b.t);

  if (timed.length < 3) return new Set();

  const gaps = timed.map(({ t, i }, idx) => ({
    i,
    gap: idx === 0 ? t - start : t - timed[idx - 1].t,
  }));

  const sorted = [...gaps].map((g) => g.gap).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return new Set(gaps.filter(({ gap }) => gap > median * 2).map(({ i }) => i));
}
