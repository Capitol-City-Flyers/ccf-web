import {ClubDataSource} from "../integrations/IntegrationTypes";
import {createContext, useContext} from "react";

export const ClubDataContext = createContext<null | Readonly<ClubDataSource>>(null);

export function useClubData() {
    const source = useContext(ClubDataContext);
    if (null == source) {
        throw Error("Context is empty.");
    }
    return source;
}
