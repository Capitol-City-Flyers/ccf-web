import {freeze, immerable} from "immer";



export class SandboxExecutor {
    [immerable] = true;

    private proxies = new WeakMap<object, object>();

    private constructor() {
    }

    compile(source: string) {
        const {proxies} = this,
            code = new Function("sandbox", `with (sandbox) { ${source} }`);
        return function (sandbox: object) {
            if (!proxies.has(sandbox)) {
                const sandboxProxy = new Proxy(sandbox, SandboxExecutor.handler)
                proxies.set(sandbox, sandboxProxy);
            }
            return code(proxies.get(sandbox));
        }
    }

    static create() {
        return freeze(new SandboxExecutor());
    }

    private static handler = freeze<ProxyHandler<any>>({
        get(target, key) {
            if (Symbol.unscopables === key) {
                return undefined;
            }
            return target[key];
        },
        has() {
            return true;
        }
    });
}
