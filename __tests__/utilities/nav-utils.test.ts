import {GeoCoordinates} from "../../src/navigation/navigation-types";

function Ellipsoid(name, a, invf) {
    /* constructor */
    this.name = name
    this.a = a
    this.invf = invf
}

function acosf(x){ /* protect against rounding error on input argument */
    if (Math.abs(x) >1){
        x /=Math.abs(x)
    }
    return Math.acos(x)
}

function atan2(y, x) {
    var out
    if (x < 0) {
        out = Math.atan(y / x) + Math.PI
    }
    if ((x > 0) && (y >= 0)) {
        out = Math.atan(y / x)
    }
    if ((x > 0) && (y < 0)) {
        out = Math.atan(y / x) + 2 * Math.PI
    }
    if ((x == 0) && (y > 0)) {
        out = Math.PI / 2
    }
    if ((x == 0) && (y < 0)) {
        out = 3 * Math.PI / 2
    }
    if ((x == 0) && (y == 0)) {
        throw Error("atan2(0,0) undefined");
    }
    return out
}

function crsdist(lat1,lon1,lat2,lon2){ // radian args
    /* compute course and distance (spherical) */

    if ((lat1+lat2==0.) && (Math.abs(lon1-lon2)==Math.PI)
        && (Math.abs(lat1) != (Math.PI/180)*90.)){
        alert("Course between antipodal points is undefined")
    }

    var crs12, crs21, d;

        d=Math.acos(Math.sin(lat1)*Math.sin(lat2)+Math.cos(lat1)*Math.cos(lat2)*Math.cos(lon1-lon2))

        if ((d==0.) || (lat1==-(Math.PI/180)*90.)){
            crs12=2*Math.PI
        } else if (lat1==(Math.PI/180)*90.){
            crs12=Math.PI
        } else {
            var argacos=(Math.sin(lat2)-Math.sin(lat1)*Math.cos(d))/(Math.sin(d)*Math.cos(lat1))
            if (Math.sin(lon2-lon1) < 0){
                crs12=acosf(argacos)
            }
            else{
                crs12=2*Math.PI-acosf(argacos)
            }
        }
        if ((d==0.) || (lat2==-(Math.PI/180)*90.)){
            crs21=0.
        } else if (lat2==(Math.PI/180)*90.){
            crs21=Math.PI
        }else{
            argacos=(Math.sin(lat1)-Math.sin(lat2)*Math.cos(d))/(Math.sin(d)*Math.cos(lat2))
            if (Math.sin(lon1-lon2)<0){
                crs21=acosf(argacos)
            }
            else{
                crs21=2*Math.PI-acosf(argacos)
            }
        }
    var out=new MakeArray(0)
    out.d=d
    out.crs12=crs12
    out.crs21=crs21
    return out
}

function dconv(selection){
    var dc=new MakeArray(3)
    dc[1]=1.
    dc[2]=1.852 //km
    dc[3]=185200.0/160934.40 // 1.150779448 sm
    dc[4]=185200.0/30.48 // 6076.11549  //ft
    return dc[selection.selectedIndex+1]
}

function mod(x, y) {
    return x - y * Math.floor(x / y)
}

function modlat(x) {
    return mod(x + Math.PI / 2, 2 * Math.PI) - Math.PI / 2
}

function modlon(x) {
    return mod(x + Math.PI, 2 * Math.PI) - Math.PI
}

function modcrs(x) {
    return mod(x, 2 * Math.PI)
}

function MakeArray(n) {
    this.length = n
    for (var i = 1; i <= n; i++) {
        this[i] = 0
    }
    // return this
}

function direct_ell(glat1, glon1, faz, s, ellipse) {
// glat1 initial geodetic latitude in radians N positive
// glon1 initial geodetic longitude in radians E positive
// faz forward azimuth in radians
// s distance in units of a (=nm)

    var EPS = 0.00000000005
    var a, r, tu, sf, cf, b, cu, su, sa, c2a, x, c, d, y, sy, cy, cz, e
    var glat2, glon2, baz, f

    if ((Math.abs(Math.cos(glat1)) < EPS) && !(Math.abs(Math.sin(faz)) < EPS)) {
        alert("Only N-S courses are meaningful, starting at a pole!")
    }

    a = ellipse.a
    f = 1 / ellipse.invf
    r = 1 - f
    tu = r * Math.tan(glat1)
    sf = Math.sin(faz)
    cf = Math.cos(faz)
    if (cf == 0) {
        b = 0.
    } else {
        b = 2. * atan2(tu, cf)
    }
    cu = 1. / Math.sqrt(1 + tu * tu)
    su = tu * cu
    sa = cu * sf
    c2a = 1 - sa * sa
    x = 1. + Math.sqrt(1. + c2a * (1. / (r * r) - 1.))
    x = (x - 2.) / x
    c = 1. - x
    c = (x * x / 4. + 1.) / c
    d = (0.375 * x * x - 1.) * x
    tu = s / (r * a * c)
    y = tu
    c = y + 1
    while (Math.abs(y - c) > EPS) {
        sy = Math.sin(y)
        cy = Math.cos(y)
        cz = Math.cos(b + y)
        e = 2. * cz * cz - 1.
        c = y
        x = e * cy
        y = e + e - 1.
        y = (((sy * sy * 4. - 3.) * y * cz * d / 6. + x) *
            d / 4. - cz) * sy * d + tu
    }

    b = cu * cy * cf - su * sy
    c = r * Math.sqrt(sa * sa + b * b)
    d = su * cy + cu * sy * cf
    glat2 = modlat(atan2(d, c))
    c = cu * cy - su * sy * cf
    x = atan2(sy * sf, c)
    c = ((-3. * c2a + 4.) * f + 4.) * c2a * f / 16.
    d = ((e * cy * c + cz) * sy * c + y) * sa
    glon2 = modlon(glon1 + x - (1. - c) * d * f)	// fix date line problems
    baz = modcrs(atan2(sa, b) + Math.PI)

    var out = new MakeArray(0)
    out.lat = glat2
    out.lon = glon2
    out.crs21 = baz
    return out
}

export function pointRadialDistance(point: GeoCoordinates, radial: number, distance: number) {
    //get select  values
    var dc
    var lat1, lon1
    var d12, crs12
    var a, invf
    /* Input and validate data */
    const {latitude, longitude} = point;
    lat1 = (Math.PI / 180) * latitude;
    lon1 = (Math.PI / 180) * longitude;

    d12 = distance;
//alert("dc=" +dc)

    crs12 = radial * Math.PI / 180;
//alert("lat1="+lat1+" lon1="+lon1+" d12="+d12+" crs12="+crs12)

    var ellipse = new Ellipsoid("WGS84", 6378.137 / 1.852, 298.257223563)
//showProps(ellipse,"ellipse")

    // elliptic code
    var cde = direct_ell(lat1, -lon1, crs12, d12, ellipse)  // ellipse uses East negative
    var lat2 = cde.lat * (180 / Math.PI)
    var lon2 = -cde.lon * (180 / Math.PI)                  // ellipse uses East negative

//alert("d="+d+"  crs12="+crs12+"   crs21="+crs21)

    return {
        latitude: lat2,
        longitude: lon2
    };
}

function crsdist_ell(glat1,glon1,glat2,glon2,ellipse){
// glat1 initial geodetic latitude in radians N positive
// glon1 initial geodetic longitude in radians E positive
// glat2 final geodetic latitude in radians N positive
// glon2 final geodetic longitude in radians E positive
    var a=ellipse.a
    var f=1/ellipse.invf
//alert("a="+a+" f="+f)
    var r, tu1, tu2, cu1, su1, cu2, s1, b1, f1
    var x, sx, cx, sy, cy,y, sa, c2a, cz, e, c, d
    var EPS= 0.00000000005
    var faz, baz, s
    var iter=1
    var MAXITER=100
    if ((glat1+glat2==0.) && (Math.abs(glon1-glon2)==Math.PI)){
        alert("Course and distance between antipodal points is undefined")
        glat1=glat1+0.00001 // allow algorithm to complete
    }
    if (glat1==glat2 && (glon1==glon2 || Math.abs(Math.abs(glon1-glon2)-2*Math.PI) <  EPS)){
        alert("Points 1 and 2 are identical- course undefined")
        var out=new MakeArray(0)
        out.d=0
        out.crs12=0
        out.crs21=Math.PI
        return out
    }
    r = 1 - f
    tu1 = r * Math.tan (glat1)
    tu2 = r * Math.tan (glat2)
    cu1 = 1. / Math.sqrt (1. + tu1 * tu1)
    su1 = cu1 * tu1
    cu2 = 1. / Math.sqrt (1. + tu2 * tu2)
    s1 = cu1 * cu2
    b1 = s1 * tu2
    f1 = b1 * tu1
    x = glon2 - glon1
    d = x + 1 // force one pass
    while ((Math.abs(d - x) > EPS) && (iter < MAXITER))
    {
        iter=iter+1
        sx = Math.sin (x)
//       alert("sx="+sx)
        cx = Math.cos (x)
        tu1 = cu2 * sx
        tu2 = b1 - su1 * cu2 * cx
        sy = Math.sqrt(tu1 * tu1 + tu2 * tu2)
        cy = s1 * cx + f1
        y = atan2 (sy, cy)
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
    faz = modcrs(atan2(tu1, tu2))
    baz = modcrs(atan2(cu1 * sx, b1 * cx - su1 * cu2) + Math.PI)
    x = Math.sqrt ((1 / (r * r) - 1) * c2a + 1)
    x +=1
    x = (x - 2.) / x
    c = 1. - x
    c = (x * x / 4. + 1.) / c
    d = (0.375 * x * x - 1.) * x
    x = e * cy
    s = ((((sy*sy*4.-3.)*(1.-e-e)*cz*d/6.-x)*d/4.+cz)*sy*d+y)*c*a*r
    out=new MakeArray(0)
    out.d=s
    out.crs12=faz
    out.crs21=baz
    if (Math.abs(iter-MAXITER)<EPS){
        alert("Algorithm did not converge")
    }
    return out

}

function pointToPointCourseDistance(point1: GeoCoordinates, point2: GeoCoordinates) {
    //get select  values
    var dc
    var lat1,lat2,lon1,lon2
    var d,crs12,crs21
    var argacos
    var a,invf


    lat1=(Math.PI/180)*point1.latitude;
    lat2=(Math.PI/180)*point2.latitude;
    lon1=(Math.PI/180)*point1.longitude;
    lon2=(Math.PI/180)*point2.longitude;

//alert("lat1=" + lat1 + "lon1=" + lon1 +"\nlat2=" +lat2+ "lon2="+lon2)

    dc=1
//alert("dc=" +dc)

    var ellipse=new Ellipsoid("WGS84", 6378.137 / 1.852, 298.257223563)
//showProps(ellipse,"ellipse")

    if (ellipse.name=="Sphere"){
        // spherical code
        var cd=crsdist(lat1,lon1,lat2,lon2) // compute crs and distance
        crs12 =cd.crs12*(180/Math.PI)
        crs21 =cd.crs21*(180/Math.PI)
        d=cd.d*(180/Math.PI)*60*dc  // go to physical units
    } else {
        // elliptic code
        var cde=crsdist_ell(lat1,-lon1,lat2,-lon2,ellipse)  // ellipse uses East negative
        crs12 =cde.crs12*(180/Math.PI)
        crs21 =cde.crs21*(180/Math.PI)
        d=cde.d*dc  // go to physical units
    }

//alert("d="+d+"  crs12="+crs12+"   crs21="+crs21)
    return {
        course: crs12,
        courseReciprocal: crs21,
        distance: d
    }
}

describe("nav-utils.ts", () => {
    test("pointRadialDistance()", () => {
        const point = pointRadialDistance({latitude: 43.286933, longitude: -89.724012}, 90, 10);
        expect(point).toStrictEqual({
            latitude: 43.286705396003235,
            longitude: -89.95220121176675
        });

        const result = pointToPointCourseDistance({latitude: 43.286933, longitude: -89.724012},
            {latitude: 43.286705, longitude:  -89.952201});
        console.dir(result);
    });
});
