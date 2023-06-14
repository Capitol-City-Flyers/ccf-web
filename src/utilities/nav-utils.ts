import {GeoCoordinates} from "../navigation/navigation-types";
import {freeze} from "immer";

export function pointRadialDistance(point: GeoCoordinates, radial: number, distance: number) {
    const {latitude, longitude} = point,
        lat1 = RADIANS_IN_DEGREE * latitude,
        lon1 = RADIANS_IN_DEGREE * longitude,
        d12 = distance,
        crs12 = radial * RADIANS_IN_DEGREE,
        cde = direct_ell(lat1, -lon1, crs12, d12); /* ellipse uses East negative */
    return {
        latitude: cde.lat * DEGREES_IN_RADIAN,
        longitude: -cde.lon * DEGREES_IN_RADIAN /* ellipse uses East negative */
    };
}

export function pointToPointCourseDistance(point1: GeoCoordinates, point2: GeoCoordinates) {
    const lat1 = RADIANS_IN_DEGREE * point1.latitude,
        lat2 = RADIANS_IN_DEGREE * point2.latitude,
        lon1 = RADIANS_IN_DEGREE * point1.longitude,
        lon2 = RADIANS_IN_DEGREE * point2.longitude,
        cde = crsdist_ell(lat1, -lon1, lat2, -lon2);
    return {
        course: cde.crs12 * (180 / Math.PI),
        returnCourse: cde.crs21 * (180 / Math.PI),
        distance: cde.d
    }
}

function atan2(y: number, x: number) {
    if (x < 0) {
        return Math.atan(y / x) + Math.PI;
    }
    if ((x > 0) && (y >= 0)) {
        return Math.atan(y / x);
    }
    if ((x > 0) && (y < 0)) {
        return Math.atan(y / x) + TWO_PI;
    }
    if ((x == 0) && (y > 0)) {
        return HALF_PI;
    }
    if ((x == 0) && (y < 0)) {
        return 3 * HALF_PI;
    }
    throw Error("atan2(0,0) undefined");
}

function mod(x: number, y: number) {
    return x - y * Math.floor(x / y);
}

function modlat(x: number) {
    return mod(x + HALF_PI, TWO_PI) - HALF_PI;
}

function modlon(x: number) {
    return mod(x + Math.PI, TWO_PI) - Math.PI;
}

function modcrs(x: number) {
    return mod(x, TWO_PI);
}

function direct_ell(glat1: number, glon1: number, faz: number, s: number) {
    const EPS = 0.00000000005;
    if ((Math.abs(Math.cos(glat1)) < EPS) && !(Math.abs(Math.sin(faz)) < EPS)) {
        throw Error("Only N-S courses are meaningful, starting at a pole!");
    }
    let f = 1 / WGS84_ELLIPSOID.invf,
        r = 1 - f,
        tu = r * Math.tan(glat1),
        sf = Math.sin(faz),
        cf = Math.cos(faz),
        b;
    if (cf == 0) {
        b = 0.
    } else {
        b = 2. * atan2(tu, cf)
    }
    let cu = 1. / Math.sqrt(1 + tu * tu),
        su = tu * cu,
        sa = cu * sf,
        c2a = 1 - sa * sa,
        x = 1. + Math.sqrt(1. + c2a * (1. / (r * r) - 1.));
    x = (x - 2.) / x;
    let c = 1. - x;
    c = (x * x / 4. + 1.) / c;
    let d = (0.375 * x * x - 1.) * x;
    tu = s / (r * WGS84_ELLIPSOID.a * c);
    let y = tu;
    c = y + 1;
    let cy, cz, e, sy;
    while (Math.abs(y - c) > EPS) {
        sy = Math.sin(y);
        cy = Math.cos(y);
        cz = Math.cos(b + y);
        e = 2. * cz * cz - 1.;
        c = y;
        x = e * cy
        y = e + e - 1.
        y = (((sy * sy * 4. - 3.) * y * cz * d / 6. + x) *
            d / 4. - cz) * sy * d + tu
    }
    b = cu * cy * cf - su * sy
    c = r * Math.sqrt(sa * sa + b * b)
    d = su * cy + cu * sy * cf
    const glat2 = modlat(atan2(d, c))
    c = cu * cy - su * sy * cf
    x = atan2(sy * sf, c)
    c = ((-3. * c2a + 4.) * f + 4.) * c2a * f / 16.
    d = ((e * cy * c + cz) * sy * c + y) * sa
    return {
        lat: glat2,
        lon: modlon(glon1 + x - (1. - c) * d * f), /* fix date line problems, */
        crs21: modcrs(atan2(sa, b) + Math.PI)
    };
}

function crsdist_ell(glat1, glon1, glat2, glon2) {
    const EPS = 0.00000000005,
        f = 1 / WGS84_ELLIPSOID.invf,
        MAXITER = 100;
    if ((glat1 + glat2 === 0) && (Math.abs(glon1 - glon2) === Math.PI)) {
        throw Error("Course and distance between antipodal points is undefined");
    }
    if (glat1 === glat2 && (glon1 === glon2 || Math.abs(Math.abs(glon1 - glon2) - TWO_PI) < EPS)) {
        throw Error("Points 1 and 2 are identical- course undefined");
    }
    const r = 1 - f;
    let tu1 = r * Math.tan(glat1),
        tu2 = r * Math.tan(glat2);
    const cu1 = 1. / Math.sqrt(1. + tu1 * tu1);
    let su1 = cu1 * tu1,
        cu2 = 1. / Math.sqrt(1. + tu2 * tu2),
        s1 = cu1 * cu2,
        b1 = s1 * tu2,
        f1 = b1 * tu1,
        x = glon2 - glon1;
    let d = x + 1; // force one pass
    let c2a, cx, cy, cz, e, c, sa, sx, sy, y, iter = 1;
    while ((Math.abs(d - x) > EPS) && (iter < MAXITER)) {
        iter = iter + 1
        sx = Math.sin(x)
        cx = Math.cos(x)
        tu1 = cu2 * sx
        tu2 = b1 - su1 * cu2 * cx
        sy = Math.sqrt(tu1 * tu1 + tu2 * tu2)
        cy = s1 * cx + f1
        y = atan2(sy, cy)
        sa = s1 * sx / sy
        c2a = 1 - sa * sa
        cz = f1 + f1
        if (c2a > 0.)
            cz = cy - cz / c2a
        e = cz * cz * 2. - 1.
        c = ((-3. * c2a + 4.) * f + 4.) * c2a * f / 16.
        d = x
        x = ((e * cy * c + cz) * sy * c + y) * sa
        x = (1. - c) * x * f + glon2 - glon1
    }
    if (Math.abs(iter - MAXITER) < EPS) {
        throw Error("Algorithm did not converge");
    }

    let faz = modcrs(atan2(tu1, tu2)),
        baz = modcrs(atan2(cu1 * sx, b1 * cx - su1 * cu2) + Math.PI);
    x = Math.sqrt((1 / (r * r) - 1) * c2a + 1)
    x += 1
    x = (x - 2.) / x
    c = 1. - x
    c = (x * x / 4. + 1.) / c
    d = (0.375 * x * x - 1.) * x
    x = e * cy
    let s = ((((sy * sy * 4. - 3.) * (1. - e - e) * cz * d / 6. - x) * d / 4. + cz) * sy * d + y) * c * WGS84_ELLIPSOID.a * r
    return {
        d: s,
        crs12: faz,
        crs21: baz
    }
}

const DEGREES_IN_RADIAN = 180 / Math.PI,
    RADIANS_IN_DEGREE = Math.PI / 180,
    HALF_PI = Math.PI / 2,
    TWO_PI = 2 * Math.PI,
    WGS84_ELLIPSOID = freeze({
        a: 6378.137 / 1.852,
        invf: 298.257223563
    }, true);
