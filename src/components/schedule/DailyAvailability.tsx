import {useEffect, useState} from "react";
import {useAircraftClubsClient} from "../../integrations/aircraftclubs/AircraftClubsContext";
import {useAppState} from "../../providers/app/AppContext";
import {MemberDetails} from "@capitol-city-flyers/ccf-web-integration";
import {BasicCredentials} from "../../providers/app/app-types";

export default function DailyAvailability() {
    const client = useAircraftClubsClient(),
        {auth: {credentials}} = useAppState(),
        [member, setMember] = useState<MemberDetails>();

    useEffect(() => {
        if (null != credentials?.password) {
            client.login(credentials as BasicCredentials)
                .then(async (session) => {
                    const member = await session.getMemberDetails(session.authentication.memberId);
                    setMember(member);
                });
        }
    }, [credentials]);

    return (
        <div>
            {member && JSON.stringify(member, null, 2)}
        </div>
    );
}
