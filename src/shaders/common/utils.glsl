
vec3 clampColor(vec3 color) {
    float v = max(color.x, max(color.y, color.z));
    if (v > 1.0) {
        color *= 1.0 / v;
    }

    return color;
}

vec3 safeOrigin(vec3 origin, vec3 direction, vec3 normal) {
	float parallel = 1.0 - abs(dot(normal, direction));
	float v = parallel * parallel;

	return origin + direction * EPSILON * (1.0 - v) + normal * EPSILON * v;
}

// random numbers generation algorithm from LH2
uint wangHash(uint s) {
    s = (s ^ 61u) ^ (s >> 16u),
    s *= 9u,
    s = s ^ (s >> 4u),
    s *= 0x27d4eb2du,
    s = s ^ (s >> 15u);
    
    return s;
}

uint unifySeed(uint seed) {
    uint xpos = uint(gl_FragCoord.x * resolution[0]);
    uint ypos = uint(gl_FragCoord.y * resolution[1]);
    uint pixelIdx = xpos + ypos * uint(resolution[0]);
    
    return wangHash(pixelIdx + seed);
}

uint randomInt(inout uint s) {
    s ^= s << 13u,
    s ^= s >> 17u,
    s ^= s << 5;
    
    return s;
}

float randomFloat(inout uint seed) {
    return float( randomInt(seed) ) * 2.3283064365387e-10;
}
//

// ToDo: remove. Legacy RNG algorithm. scale: vec3(12.9898, 78.233, 151.7182), vec3(63.7264, 10.873, 623.6736)
// float randomFloat(vec3 scale, float seed) {
//     return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
// }

vec3 cosineWeightedDirection(uint seed, vec3 normal) {
    uint uSeed = unifySeed(seed);

    float u = randomFloat(uSeed);
    float v = randomFloat(uSeed);
    float r = sqrt(u);
    float angle = 6.283185307179586 * v;

    vec3 sdir, tdir;
    if (abs(normal.x) < 0.5) {
        sdir = cross(normal, vec3(1, 0, 0));
    } else {
        sdir = cross(normal, vec3(0, 1, 0));
    }
    tdir = cross(normal, sdir);

    return normalize(
        r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1.0 - u) * normal
    );
}