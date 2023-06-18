import Require from "../../components/auth/Require";
import PageLink from "../../components/layout/PageLink";

export default function() {
    return (
        <Require authenticate authenticated>
            <h1 className="text-3xl font-bold underline">Profile</h1>
            <div>
                <h2>Links</h2>
                <PageLink href="/">Home</PageLink>
            </div>
        </Require>
    );
}
