import {PropsWithChildren, useMemo} from "react";
import {freeze} from "immer";
import _ from "lodash";
import type {StorageContext} from "./StorageContext";
import {storageContext} from "./StorageContext";
import {StorageRepositoryImpl} from "./StorageRepositoryImpl";
import type {ProviderComponentProps} from "../app/app-types";

export default function StorageProvider(props: PropsWithChildren<ProviderComponentProps>) {
    const {children, env} = props,
        context = useMemo<StorageContext>(() => {
            const storage = "_build" === env ? buildStorage : window.localStorage,
                createRepository = _.partial(StorageRepositoryImpl.create, storage);
            return freeze({createRepository}, true) as StorageContext;
        }, []);
    return (
        <storageContext.Provider value={context}>
            {children}
        </storageContext.Provider>
    );
}

/**
 * Dummy implementation of the {@link Storage} interface used at build time.
 */
const buildStorage: Storage = freeze({
    clear() {
        throw Error("Unsupported operation.");
    },
    getItem: () => null,
    key: () => null,
    length: 0,
    removeItem() {
        throw Error("Unsupported operation.");
    },
    setItem() {
        throw Error("Unsupported operation.");
    },
}, true);
