/**
 * [Promise] reject callback.
 */
export type PromiseReject<T> = Parameters<ConstructorParameters<typeof Promise<T>>[0]>[1];

/**
 * [Promise] resolve callback.
 */
export type PromiseResolve<T> = Parameters<ConstructorParameters<typeof Promise<T>>[0]>[0];
