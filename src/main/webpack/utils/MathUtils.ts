/**
 * Convert a fraction to a percentage, optionally using a specified scale.
 *
 * @param fraction the fraction.
 * @param scale the scale of the returned percentage, defaults to 2 decimal places.
 */
export function toPercent(fraction: number, scale: number = 2) {
    const multiplier = Math.pow(10, scale);
    return Math.round(fraction * 100 * multiplier) / multiplier;
}
