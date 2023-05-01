import {freeze, immerable} from "immer";
import _ from "lodash";

/**
 * {@link JsExtractor} evaluates JavaScript code in a very simple way to allow extraction of data via pattern matched
 * callback handlers. This is used to pull dynamically assigned form state out of HTML documents.
 *
 * Scripts are evaluated within a context which pretends to be able to resolve *any* user variable. Variables are
 * resolved to proxies which consist of a context holding the pattern of property accesses and function invocations
 * which navigated to them. Upon invocation, these proxies check for rules matching their paths and, if found,
 * invoke the corresponding {@link ExtractionRule.extract} method to extract result(s).
 *
 * Upon completion of script evaluation, an array of all extraction results is returned.
 */
export class JsExtractor<T> {
    [immerable] = true;

    private constructor(private rules: Array<ExtractionRule<T>>) {
    }

    /**
     * Execute the extraction rules against a string of JavaScript source code.
     *
     * @param script the script to execute.
     */
    execute(script: string) {

        /* Compile the script into a sandbox-like function with no access to application state. */
        const compiled = new Function("root", `with (root) { ${script} }`),
            {rules} = this,
            results = new Array<T>();

        /* Create root evaluator and invoke the compiled function; accumulate and return extracted values. */
        compiled(JsEvalNode.create<T>({
            stack: [{
                kind: "evaluation root",
                vars: new Map()
            }],
            results, rules
        }));
        return results;
    }

    /**
     * Create a {@link JsExtractor} instance. The instance maintains no state except for the rule list, and therefore
     * can be reused so long as the rules are stateless.
     *
     * @param rules the extraction rules.
     */
    static create<T>(rules: Array<ExtractionRule<T>>) {
        return freeze(new JsExtractor<T>(rules), true);
    }
}

/**
 * {@link JsEvalNode} is a proxy handler that is used to capture method invocations and property accesses by a
 * {@link JsExtractor} instance.
 */
class JsEvalNode<T> implements ProxyHandler<any> {

    constructor(private context: ExtractionContext<T>) {
    }

    apply(target: any, thisArg: any, args: any[]): any {

        /* Construct the full property path for this node and a child stack for evaluation of sub-nodes. */
        const {context} = this,
            {results, rules, stack} = context,
            path = stack.filter(isPropertyRead).map(({name}) => name),
            name = _.last(path)!,
            childStack = new Array<ExtractionNode>(...stack, {
                kind: "method invocation",
                vars: new Map(),
                args, name
            });

        /* Check for rules matching this node; invoke extract() for each match. */
        rules.filter(rule => _.isEqual(rule.path, path))
            .forEach(rule => results.push(...(rule.extract(childStack) || [])));

        /* Create and return a sub-node evaluator. */
        return JsEvalNode.create<T>({
            ...context,
            stack: childStack
        });
    }

    get(target: any, p: string | symbol, receiver: any): any {
        if (Symbol.unscopables === p) {
            return undefined;
        } else if (Symbol.toPrimitive === p) {
            return _.noop;
        }

        /* Look for a matching variable in scope. */
        const {context} = this,
            {stack} = context,
            scopes = stack.filter(isVariableScope).reverse(),
            value = _.transform(scopes, (result, {vars}) => {
                if (vars.has(p)) {
                    result.push(vars.get(p));
                    return false;
                }
            }, new Array<any>());
        if (!_.isEmpty(value)) {
            return value;
        }

        /* No matching variable, create and return an evaluation sub-node. */
        return JsEvalNode.create<T>({
            ...context,
            stack: [...stack, {
                kind: "property read",
                name: p
            }]
        });
    }

    has(target: any, p: string | symbol): boolean {
        return true;
    }

    set(target: any, p: string | symbol, newValue: any, receiver: any): boolean {

        /* Set the variable in the nearest scope entry in the context stack. */
        const {vars} = _.findLast(this.context.stack, isVariableScope)!;
        vars.set(p, newValue);
        return true;
    }

    /**
     * Create a {@link JsExtractor} instance.
     *
     * @param context the context to be evaluated by the node.
     */
    static create<T>(context: ExtractionContext<T>) {
        return new Proxy(_.noop, new JsEvalNode(context));
    }
}

/**
 * Context stack entry representing a property read.
 */
interface PropertyRead {
    kind: "property read";
    name: string | symbol;
}

/**
 * Context stack entry representing a method invocation.
 */
interface MethodInvocation {
    kind: "method invocation";
    name: string | symbol;
    args: Array<any>;
    vars: Map<string | symbol, any>;
}

/**
 * Root context stack entry.
 */
interface EvaluationRoot {
    kind: "evaluation root";
    vars: Map<string | symbol, any>;
}

/**
 * All context stack entry types.
 */
type ExtractionNode =
    | EvaluationRoot
    | MethodInvocation
    | PropertyRead;

/**
 * Context held during evaluation of a script.
 */
interface ExtractionContext<T> {
    results: Array<T>;
    rules: Array<ExtractionRule<T>>;
    stack: Array<ExtractionNode>;
}

/**
 * Rule associating a property path with a handler to be invoked when access to that property is matched.
 */
type ExtractionRule<T> = {
    path: Array<string | symbol>;

    /**
     * Extractor function to invoke when the path is matched. The function receives the full context stack which was
     * navigated to reach the match. If the function returns an array, its contents are added to the extraction results.
     * Any other type of return value is ignored.
     *
     * @param context the context stack.
     */
    extract: (context: Array<ExtractionNode>) => Array<T> | any;
};

/**
 * Type guard for {@link EvaluationRoot}.
 *
 * @param value the value to check.
 */
function isEvaluationRoot(value: any): value is EvaluationRoot {
    return "object" === typeof value
        && "kind" in value
        && "evaluation root" === value["kind"];
}

/**
 * Type guard for {@link MethodInvocation}.
 *
 * @param value the value to check.
 */
export function isMethodInvocation(value: any): value is MethodInvocation {
    return "object" === typeof value
        && "kind" in value
        && "method invocation" === value["kind"];
}

/**
 * Type guard for {@link PropertyRead}.
 *
 * @param value the value to check.
 */
function isPropertyRead(value: any): value is PropertyRead {
    return "object" === typeof value
        && "kind" in value
        && "property read" === value["kind"];
}

/**
 * Type guard for {@link EvaluationRoot} or {@link MethodInvocation}, meaning all nodes that define a variable scope.
 *
 * @param value the value to check.
 */
function isVariableScope(value: any): value is (EvaluationRoot | MethodInvocation) {
    return isEvaluationRoot(value) || isMethodInvocation(value);
}
