/**
 * Display percentage for UI. Values in (0, 1) are treated as fractions (e.g. 0.99 → 99%).
 */
export function formatPercentageDisplay(value) {
    if (value == null || value === '') return '—';
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    const pct = n > 0 && n < 1 ? n * 100 : n;
    const rounded = Math.round(pct * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 1e-9) {
        return `${Math.round(rounded)}%`;
    }
    return `${rounded}%`;
}
