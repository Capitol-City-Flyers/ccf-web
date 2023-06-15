import {pointRadialDistance, pointToPointCourseDistance} from "../../src/utilities/nav-utils";

describe("nav-utils.ts", () => {
    test("pointRadialDistance()", () => {
        const point = pointRadialDistance({latitude: 43.286933, longitude: -89.724012}, 90, 10);
        expect(point).toStrictEqual({
            latitude: 43.286705396003235,
            longitude: -89.95220121176675
        });
    });
    test("pointToPointCourseDistance()", () => {
        const cd = pointToPointCourseDistance({latitude: 43.286933, longitude: -89.724012},
            {latitude: 43.286705, longitude: -89.952201});
        expect(cd).toStrictEqual({
            course: 90.00013625522134,
            distance: 9.999990733033124,
            returnCourse: 270.15659435965705
        });
    });
});
