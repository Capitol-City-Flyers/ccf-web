import {isRole, Role, RoleResolver, RolesSpec} from "./app-types";
import {freeze} from "immer";
import _ from "lodash";

/**
 * Create a role resolver which will evaluate against a given list of `granted` roles.
 *
 * Optionally accepts a `spec` object which maps arbitrary keys to {@link RolesSpec} objects to pre-evaluate. For each
 * key, evaluates the associated specification, and if it evaluates to `true`, includes the original key mapped to
 * `true` in the returned resolver. Note that specifications which evaluate to `false` are **not** included in the
 * resolver.
 *
 * In addition to the items defined on the {@link RoleResolver} and the specification evaluation results described
 * above, the returned object also contains a mapping to `true` for each granted role.
 *
 * @param granted the list of granted roles.
 * @param spec the optional specification of any roles to pre-evaluate.
 */
export function createRoleResolver<S extends Record<string, RolesSpec>>(
    granted: Array<Role>,
    spec?: S
): RoleResolver & Partial<{ [R in Role]: true } & { [K in keyof S]: true }> {
    return freeze({
        evaluateRoles: _.partial(evaluateRoles, granted),
        missingRoles: _.partial(missingRoles, granted),
        ...Object.fromEntries(_.map(granted, role => [role, true])),
        ...(!spec ? {} : _.transform(Object.entries(spec), (acc, [key, spec]) => {
            if (evaluateRoles(granted, spec)) {
                acc[key] = true;
            }
        }, {}))
    });
}

/**
 * Evaluate a {@link RolesSpec} against a list of `granted` roles, returning a flag indicating whether the specification
 * is met.
 *
 * @param granted the list of granted roles.
 * @param spec the specification to evaluate.
 */
export function evaluateRoles(granted: Array<Role>, spec: RolesSpec) {
    let required: Array<Role>,
        all = true;
    if (isRole(spec)) {
        required = [spec];
    } else if (_.isArray(spec)) {
        required = _.uniq(spec);
    } else if ("all" in spec) {
        required = _.uniq(isRole(spec.all) ? [spec.all] : spec.all);
    } else if ("any" in spec) {
        required = _.uniq(isRole(spec.any) ? [spec.any] : spec.any);
        all = false;
    } else {
        throw Error("Invalid role spec.");
    }
    const missing = missingRoles(granted, required);
    return all ? 0 === missing.length : 0 !== _.difference(required, missing).length;
}

/**
 * Given a list of `granted` roles and one or more `required` roles (or arrays of `required` roles), return an array
 * containing only those roles which were *not* present in the granted list.
 *
 * @param granted the list of granted roles.
 * @param required the required roles and/or arrays of required roles.
 */
export function missingRoles(granted: Array<Role>, ...required: Array<Role | Array<Role>>) {
    return _.flatten(required.map(roles => _.isArray(roles) ? roles : [roles]))
        .filter(role => -1 === granted.indexOf(role));
}
