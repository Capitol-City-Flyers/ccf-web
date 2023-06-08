import _ from "lodash";

/**
 * Get a validator function which takes a single argument and checks for inclusion in a list of valid values.
 *
 * @param firstValues the first valid value or array of values.
 * @param additionalValues the second valid value or array of values.
 */
export function validateIn<V>(firstValues: V | Array<V>, ...additionalValues: Array<V | Array<V>>) {
    const values = _.flattenDeep([firstValues, additionalValues]);
    return (value: V) => -1 !== values.indexOf(value);
}