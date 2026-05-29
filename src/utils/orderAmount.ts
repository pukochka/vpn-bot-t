/** Парсит сумму заказа в копейки: `"66 ₽"` → 6600, `40000` → 40000. */
export const parseOrderAmountToKopecks = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return null;

  const rubles = Number(digits);
  if (!Number.isFinite(rubles)) return null;

  return Math.round(rubles * 100);
};
