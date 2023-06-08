import membersJpg from "../../../public/images/DSC03436.jpg";
import n271rgNoseJpg from "../../../public/images/N271RG_-_Nose.jpg";
import n569dsNoseJpg from "../../../public/images/N569DS_-_nose.jpg";

export default function MembershipIndex() {
    return (
        <>
            <section className="text-justify">
                <div className="flex flex-col space-y-3 lg:flex-row lg:space-x-3 place-items-center">
                    <div className="relative lg:w-2/3">
                        <div className="overflow-clip rounded-2xl shadow-md">
                            <img src={membersJpg.src} alt="Fleet"/>
                        </div>
                    </div>
                    <div className="lg:w-1/3">
                        <div
                            className="lg:border relative z-10 space-y-3 lg:bg-blue-50 lg:bg-opacity-95 lg:-ml-20 lg:p-6 lg:rounded-2xl lg:shadow-xl">
                            <p>
                                <span className="text-xl font-extrabold">Capitol City Flyers</span> is a member owned,
                                not-for-profit corporation. Members own equity shares of the corporation. The number of
                                shares outstanding, and thus the number of member pilots, is currently limited to
                                thirty.
                            </p>
                            <p>
                                Members must be, at minimum, certificated private pilots or advanced primary
                                students. Security, insurance, financial, and currency requirements apply. We pay
                                monthly dues to cover fixed expenses and hourly fees for the time we fly. Dues range
                                from $220 to $170 per month depending on whether the available $50 flying credit is
                                earned in that month.
                            </p>
                            <p>
                                We offer a free Social Membership level, which does not include ownership or access to
                                aircraft, but is a great way to get to know the Club before you decide to join. Contact
                                the Board of Directors
                                at <a href="mailto:info@capcityflyers.com">info@capcityflyers.com</a> for a membership
                                application if you are interested in sharing the pride, benefits, and expenses of
                                aircraft ownership with thirty like-minded pilots.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="text-justify space-y-3">
                <div className="float-left hidden md:w-1/2 md:py-4 md:px-4 md:pl-0 md:block">
                    <div className="overflow-clip rounded-2xl shadow-md">
                        <img src={n271rgNoseJpg.src} alt="N271RG"/>
                    </div>
                </div>
                <h1 className="text-xl font-extrabold">Club Membership</h1>
                <h2 className="font-extrabold whitespace-nowrap">
                    What is a flying club?
                </h2>
                <p>
                    A flying club is a member-run organization that provides affordable access to aircraft. Some flying
                    clubs are equity based, where members own the aircraft, and some are non-equity based, where they do
                    not. Capitol City Flyers is an equity-based flying club. We all own an equal share of our aircraft.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    How does Capitol City Flyers differ from aircraft rental?
                </h2>
                <p>
                    There are two major differences. First, and most simply, we own our aircraft. We care about them
                    and have a say in what happens to them, therefore they are better equipped and better maintained
                    than typical rental aircraft.
                </p>
                <p>
                    Second, we differ in fee structure. Aircraft rental organizations, typically fixed base operators
                    ("FBOs"), must include all of their costs in their hourly rental rates. Capitol City Flyers charges
                    monthly dues to cover fixed expenses; hourly rates need only cover the costs of operating the
                    aircraft.
                </p>
                <p>
                    Our hourly rates are based on <em>tach time</em> whereas FBO rates are usually based
                    on <em>Hobbs time</em>. On average, one Hobbs hour equates to 0.85 tach hour. When we fly for an
                    hour, we are billed for about 51 minutes. Both Capitol City Flyers and an FBO vary hourly rates to
                    cover the cost of fuel, but Capitol City Flyers credits us for fuel we purchase at a lower price
                    than what is available at our airport.
                </p>
                <p>
                    Additionally, since we own the aircraft, we do not pay sales tax on our hourly rates.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    How do I join Capitol City Flyers?
                </h2>
                <p>
                    You must purchase a share from the Club or from a current member. A membership application must
                    be submitted to the Club and approved by the President. Capitol City Flyers is currently capped at
                    thirty members.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    Are there shares available? At what price?
                </h2>
                <p>
                    We typically have four or five membership changes per year. Purchase of a share in Capitol City
                    Flyers is a private transaction between the buyer and seller. The Club is not a party in price
                    negotiations. There is a $50 stock transfer fee, payable to the Club, at time of transfer.
                </p>
                <p>
                    It takes an average of three to five days to process and approve a new member application.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    Are there limitations on who can join?
                </h2>
                <p>
                    Members must hold at least a private pilot certificate or be a student pilot with a minimum of 25
                    hours total time logged in the proceeding six months.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    Are there limitations that apply after joining?
                </h2>
                <p>
                    Members must follow the Club's Standard Operating Procedures. These rules govern membership
                    requirements and responsibilities, eligibility to fly Club aircraft, limitations on flight
                    operations and scheduling, dues and payments, and penalties for violating Club rules.
                </p>
                <div className="clear-both hidden float-left md:w-1/2 md:px-4 md:my-8 md:pl-0 md:block">
                    <div className="overflow-clip rounded-2xl shadow-md">
                        <img src={n569dsNoseJpg.src} alt="N569DS"/>
                    </div>
                </div>
                <h1 className="text-xl font-extrabold">Aircraft</h1>
                <h2 className="font-extrabold whitespace-nowrap">
                    How are the aircraft scheduled?
                </h2>
                <p>
                    The Club uses <a href="https://aircraftclubs.com">AircraftClubs.com</a> as its flight scheduler.
                    Each member is given a unique username and password. Access to reserve particular aircraft is
                    granted upon receipt of an instructor endorsement or at the beginning of training toward
                    such an endorsement.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    Are there limitations on scheduling?
                </h2>
                <p>
                    Student Pilots cannot schedule the Skylane or the Diamond. The maximum number of active reservations
                    per member is six. Aircraft may be scheduled up to 180 days in advance. Both of these limits can be
                    overridden by a member of the Board of Directors for significant reason.
                </p>
                <p>
                    The Maintenance Officer must be notified when an aircraft is reserved for more than 5 days to ensure
                    that it will be completely up to date on maintenance for the duration of the reservation. Trips
                    outside of the United States must be coordinated with the Board of Directors to ensure that
                    insurance and international flight requirements are met.
                </p>
                <h2 className="font-extrabold whitespace-nowrap">
                    What are dues and what do they cover?
                </h2>
                <p>
                    Monthly dues are $220 per month. Dues cover the fixed costs of the Club. Each member can earn a
                    flying credit of $50 towards their monthly dues if they fly at least once in a given month.
                </p>
                <p>
                    Expenses paid by dues include:
                </p>
                <ul className="pl-8 list-disc">
                    <li>Insurance</li>
                    <li>Inspections</li>
                    <li>Hangar rent</li>
                    <li>Debt service</li>
                    <li>GPS subscriptions</li>
                    <li>Tax preparation and filing</li>
                    <li>Monthly flying credit</li>
                    <li>Online services and subscriptions</li>
                </ul>
                <h2 className="font-extrabold whitespace-nowrap">
                    How are dues and flight charges collected?
                </h2>
                <p>
                    The Treasurer collects flight tickets, calculates flight charges for each member, and applies flying
                    credit and applicable fees, such as unpaid balance from the previous month. The billing statement is
                    sent via email at the beginning of the month and posted on the Club’s DropBox account.
                </p>
                <p>
                    The balance must be received by the Club before the end of the month. Penalties will be assessed on
                    late payments per the Club's Standard Operating Procedures.
                </p>
            </section>
        </>
    );
}
