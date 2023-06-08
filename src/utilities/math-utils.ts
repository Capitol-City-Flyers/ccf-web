/**
 * Convert a fraction to a percentage, optionally using a specified scale.
 *
 * @param fraction the fraction.
 * @param digits the number of decimal digits (scale), defaults to 2.
 */
export function percent(fraction: number, digits: number = 2) {
    return scale(fraction * 100, digits);
}

/**
 * Scale (by rounding) a value to some number of decimal digits.
 *
 * Note: the returned value may express a number of decimal digits different from `digits` due to the floating point
 * nature of the `number` type.
 *
 * @param value the value to scale.
 * @param digits the number of decimal digits.
 */
export function scale(value: number, digits: number) {
    if (digits < 0) {
        throw Error("Digits cannot be negative.");
    }
    if (0 === digits) {
        return Math.round(value);
    }
    const multiplier = Math.pow(10, digits);
    return Math.round(value * multiplier) / multiplier;
}
