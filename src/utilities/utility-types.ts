/**
 * [Promise] reject callback.
 */
export type PromiseReject<T> = Parameters<ConstructorParameters<typeof Promise<T>>[0]>[1];

/**
 * [Promise] resolve callback.
 */
export type PromiseResolve<T> = Parameters<ConstructorParameters<typeof Promise<T>>[0]>[0];

/**
 * Require exactly one property (*any* one property) of a type.
 *
 * [Stolen from here](https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist)
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
    & Pick<T, Exclude<keyof T, Keys>>
    & {
    [K in Keys]-?:
    & Required<Pick<T, K>>
    & Partial<Record<Exclude<Keys, K>, undefined>>
}[Keys];
