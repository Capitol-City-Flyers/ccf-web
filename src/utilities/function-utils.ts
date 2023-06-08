import _ from "lodash";

/**
 * Create a throttling wrapper which defers invocations of an asynchronous function such that the function is only
 * invoked once per `wait` milliseconds.
 *
 * @param original the target function.
 * @param wait the minimum interval between invocations of the target function, in milliseconds.
 */
export function throttleAsync<F extends (...args: any) => Promise<any>>(original: F, wait: number) {
    let lastInvocation = new Date(0);
    return (...args: any) => {
        const now = new Date(),
            delayMillis = (lastInvocation.getTime() + wait) - now.getTime();
        if (delayMillis <= 0) {
            return original(...args);
        }
        return new Promise(resolve => {
            console.debug(`Delaying an invocation for ${delayMillis}ms.`);
            _.delay(() => {
                original(...args).then(resolve);
            }, delayMillis);
        });
    }
}
