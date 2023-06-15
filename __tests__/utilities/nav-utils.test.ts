import {pointRadialDistance, pointToPointCourseDistance} from "../../src/utilities/nav-utils";
import {GeoCoordinates} from "../../src/navigation/navigation-types";
import {scale} from "../../src/utilities/math-utils";

describe("nav-utils.ts", () => {
    const msn: GeoCoordinates = {latitude: 43.1398791, longitude: -89.3375045},
        lse: GeoCoordinates = {latitude: 43.8792657, longitude: -91.2566336};
    test("pointRadialDistance()", () => {
        const point = pointRadialDistance(msn, 298.5525002, 94.8071826);
        expect(scale(point.latitude, 7)).toBe(lse.latitude);
        expect(scale(point.longitude, 7)).toBe(lse.longitude);
    });
    test("pointToPointCourseDistance()", () => {
        const cd = pointToPointCourseDistance(msn, lse);
        expect(scale(cd.course, 7)).toBe(298.5525002);
        expect(scale(cd.distance, 7)).toBe(94.8071826);
        expect(scale(cd.returnCourse, 7)).toBe(117.2311335);
    });
});
