import {useCallback, useMemo, useState} from "react";
import {freeze} from "immer";
import _ from "lodash";
import BasicLoginForm, {BasicLoginFormContents} from "../../components/auth/BasicLoginForm";
import {useApp} from "../../providers/app/AppContext";
import {useMessages} from "../../providers/messages/MessagesContext";
import {useAircraftClubsClient} from "./AircraftClubsContext";
import type {IntegrationConfig} from "../../config-types";
import type {Role} from "../../providers/app/app-types";
import {isLoginIncorrect} from "@capitol-city-flyers/ccf-web-integration";

/**
 * [AircraftClubsLogin] presents a simple username/password form which delegates to [AircraftClubsClient] for
 * authentication.
 *
 * @constructor
 */
export default function AircraftClubsLoginPanel() {
    const client = useAircraftClubsClient(),
        messages = useMessages({
            loginFailed: "cin.login.failed",
            loginIncorrect: "cin.login.incorrect"
        }),
        {config, dispatch, state: {auth, prefs}} = useApp(),
        [errorMessage, setErrorMessage] = useState<string>(),
        initialForm = useMemo<BasicLoginFormContents>(() => {
            const {auth: {retention}} = prefs,
                {credentials} = auth;
            return freeze(_.assign({
                password: "",
                username: "",
                retention
            }, credentials), true);
        }, []);

    /* Form event handlers. */
    const onLoginSubmit = useCallback((form: BasicLoginFormContents) => {
        client.login(form)
            .then(({authentication}) => {
                    dispatch({
                        kind: "authChanged",
                        payload: {
                            credentials: _.pick(form, "password", "username"),
                            roles: mapRoles(authentication.permissions, config.integration.aircraftClubs.roleMappings)
                        }
                    });
                    dispatch({
                        kind: "authRetentionPrefsChanged",
                        payload: form.retention
                    });

                    /* Dispatch identity update if we didn't previously have identity. */
                    if (!prefs.identity) {
                        dispatch({
                            kind: "identityPrefsChanged",
                            payload: {
                                email: authentication.email,
                                familyName: authentication.familyName,
                                givenName: authentication.givenName,
                            }
                        });
                    }
            })
            .catch(ex => {
                if (isLoginIncorrect(ex)) {
                    console.error(messages.loginIncorrect);
                    setErrorMessage(messages.loginIncorrect);
                } else {
                    console.error(messages.loginFailed, ex);
                    setErrorMessage(messages.loginFailed);
                }
            });
    }, [dispatch, prefs, setErrorMessage]);
    return (<BasicLoginForm error={errorMessage} form={initialForm} onSubmit={onLoginSubmit}/>);
}

function mapRoles(permissions: string[], mappings: IntegrationConfig["aircraftClubs"]["roleMappings"]) {
    const perms = permissions.map(permission => parseInt(permission, 10))
            .filter(permission => !_.isNaN(permission)),
        roles = _.transform(perms, (acc, permission) => {
            const roles = mappings[permission];
            if (roles) {
                acc.push(...(_.isArray(roles) ? roles : [roles]));
            }
        }, new Array<Role>("authenticated", "fullyAuthenticated", "identified"));
    return freeze<Array<Role>>(_.sortedUniq(roles));
}
