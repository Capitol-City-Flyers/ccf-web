import _ from "lodash";

/**
 * Flatten a list of values or arrays of values (in any combination) into a single array of values.
 *
 * @param first the first value or array of values.
 * @param additional the second through last values or arrays of values.
 */
export function flattenValues<TArg>(first: TArg | Array<TArg>, ...additional: Array<TArg | Array<TArg>>): Array<TArg> {
    return _.flatten(_.map([first, ...additional], args => _.isArray(args) ? args : [args]));
}

/**
 * Get a validator function which takes a single argument and checks for inclusion in a list of valid values.
 *
 * @param firstValues the first valid value or array of values.
 * @param additionalValues the second valid value or array of values.
 */
export function validateIn<V>(firstValues: V | Array<V>, ...additionalValues: Array<V | Array<V>>) {
    const values = flattenValues(firstValues, ...additionalValues);
    return (value: V) => -1 !== values.indexOf(value);
}