import {freeze} from "immer";
import {PromiseReject, PromiseResolve} from "./utility-types";

/**
 * [Deferred] is a [Promise] which can be resolved externally.
 */
export class Deferred<T> implements Promise<T> {
    get [Symbol.toStringTag]() {
        return "Deferred";
    };

    private constructor(
        public resolve: PromiseResolve<T>,
        public reject: PromiseReject<T>,
        private promise: Promise<T>) {
    }

    catch<TResult = never>(onrejected?: ((reason: any) => (PromiseLike<TResult> | TResult)) | undefined | null): Promise<T | TResult> {
        return this.promise.catch(onrejected);
    }

    finally(onfinally?: (() => void) | undefined | null): Promise<T> {
        return this.promise.finally(onfinally);
    }

    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => (PromiseLike<TResult1> | TResult1)) | undefined | null, onrejected?: ((reason: any) => (PromiseLike<TResult2> | TResult2)) | undefined | null): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    /**
     * Create a [Deferred] instance.
     */
    static create<T>() {
        let promiseReject: PromiseReject<T>,
            promiseResolve: PromiseResolve<T>;
        const promise = new Promise<T>((resolve, reject) => {
            promiseReject = reject;
            promiseResolve = resolve;
        });
        return freeze(new Deferred(promiseResolve!, promiseReject!, promise));
    }
}

