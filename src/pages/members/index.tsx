import Require from "../../components/auth/Require";
import Link from "next/link";

export default function() {
    return (
        <Require authenticate authenticated>
            <h1 className="text-3xl font-bold underline">Profile</h1>
            <div>
                <h2>Links</h2>
                <Link href="/">Home</Link>
            </div>
        </Require>
    );
}
