import Link from "next/link";
import {useOidcUser} from "@axa-fr/react-oidc";
import Require from "../../components/auth/Require";

export default function () {
    return (
        <Require member>
            <h1 className="text-3xl font-bold underline">Profile</h1>
            <div>
                <h2>Links</h2>
                <Link href="/">Home</Link>
                <SomeComponent/>
            </div>
        </Require>
    );
}

function SomeComponent() {
    const user = useOidcUser();
    return (
        <>
            {JSON.stringify(user)}
        </>
    );
}
