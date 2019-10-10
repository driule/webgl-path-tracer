#version 300 es

@import ./common/precisions;

#define EPSILON 0.0001
#define INFINITY 10000.0

#define PI 3.14159
#define INVERSE_PI 1.0 / PI

#define BOUNCES 3
#define STACK_SIZE 256
#define SMALL_STACK_SIZE 16

@import ./common/entities/ray;
@import ./common/entities/triangle;
@import ./common/entities/material;
@import ./common/entities/bounding-box;
@import ./common/entities/intersection;
@import ./common/entities/sphere;
@import ./common/entities/light;

in vec3 initialRay;
out vec4 pixelColor;

// path tracer settings
uniform vec2 resolution;
uniform vec3 eye;
uniform float textureWeight;
uniform uint hostSeed;
uniform sampler2D outputTexture; // #0

// geometry
uniform float triangleDataTextureSize;
uniform sampler2D triangleDataTexture; // #1

// lights
uniform int totalLights;
uniform float lightDataTextureSize;
uniform sampler2D lightDataTexture; // #2

// bvh: list of nodes (bounding boxes) with references to children nodes
uniform float bvhDataTextureSize;
uniform sampler2D bvhDataTexture; // #3

// stack for BVH traversal
int stackPointer;
int stack[STACK_SIZE];

// texturing
uniform sampler2D materialsTexture; // #4
uniform float materialsTextureSize;

// textures for albedo images
uniform sampler2D albedoTexture1; // #5
uniform sampler2D albedoTexture2; // #6
uniform sampler2D albedoTexture3; // #7
uniform sampler2D albedoTexture4; // #8
uniform sampler2D albedoTexture5; // #9
uniform sampler2D albedoTexture6; // #10
uniform sampler2D albedoTexture7; // #11
uniform float albedoTextureSize;

// skydome
uniform bool isSkydomeLoaded;
uniform float skydomeTextureSize;
uniform int skydomeWidth;
uniform int skydomeHeight;
uniform sampler2D skydomeTexture1; // #12
uniform sampler2D skydomeTexture2; // #13
uniform sampler2D skydomeTexture3; // #14
uniform sampler2D skydomeTexture4; // #15

// data structures fetching from textures
@import ./common/data-fetch;

// general GL utilities
@import ./common/utils;

float intersectTriangle(Ray ray, Triangle triangle) {
    float t, u, v;

    vec3 ab = triangle.b - triangle.a;
    vec3 ac = triangle.c - triangle.a;
    vec3 pvec = cross(ray.direction, ac);
    float det = dot(ab, pvec);

    float invDet = 1.0 / det;

    vec3 tvec = ray.origin - triangle.a;
    u = dot(tvec, pvec) * invDet;

    if (u < 0.0 || u > 1.0) return INFINITY;

    vec3 qvec = cross(tvec, ab);
    v = dot(ray.direction, qvec) * invDet;
    if (v < 0.0 || u + v > 1.0) return INFINITY;

    t = dot(ac, qvec) * invDet;
    if (t >= EPSILON)
    {
        return t;
    }

    return INFINITY;
}

// vec3 getTriangleNormal(Triangle triangle) {
//     return normalize(
//         cross(triangle.a - triangle.b, triangle.b - triangle.c)
//     );
// }

bool isIntersectingBoundingBox(Ray invertedRay, BoundingBox boundingBox, out float t) {
    float tmin, tmax, txmin, txmax, tymin, tymax, tzmin, tzmax;

    txmin = (boundingBox.min.x - invertedRay.origin.x) * invertedRay.direction.x;
    txmax = (boundingBox.max.x - invertedRay.origin.x) * invertedRay.direction.x;

    tymin = (boundingBox.min.y - invertedRay.origin.y) * invertedRay.direction.y;
    tymax = (boundingBox.max.y - invertedRay.origin.y) * invertedRay.direction.y;

    tzmin = (boundingBox.min.z - invertedRay.origin.z) * invertedRay.direction.z;
    tzmax = (boundingBox.max.z - invertedRay.origin.z) * invertedRay.direction.z;

    tmin = min(txmin, txmax);
    tmax = max(txmin, txmax);

    tmin = max(tmin, min(tymin, tymax));
    tmax = min(tmax, max(tymin, tymax));

    tmin = max(tmin, min(tzmin, tzmax));
    tmax = min(tmax, max(tzmin, tzmax));

    // early out if intersection is further than the last one
    if (tmin > invertedRay.t)
        return false;

    if (tmax >= EPSILON && tmax >= tmin) {
        t = tmin;
        return true;
    }

    return false;
}

float intersectSphere(Ray ray, Sphere sphere) {
    vec3 toSphere = ray.origin - sphere.center;
    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(toSphere, ray.direction);
    float c = dot(toSphere, toSphere) - sphere.radius * sphere.radius;
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant > 0.0) {
        float t = (-b - sqrt(discriminant)) / (2.0 * a);
        if (t >= EPSILON) return t;
    }

    return INFINITY;
}

vec3 calculateBarycentricCoordinates(Triangle triangle, vec3 hit) {
    vec3 v0 = triangle.b - triangle.a;
    vec3 v1 = triangle.c - triangle.a;
    vec3 v2 = hit - triangle.a;

    float d00 = dot(v0, v0);
    float d01 = dot(v0, v1);
    float d11 = dot(v1, v1);
    float d20 = dot(v2, v0);
    float d21 = dot(v2, v1);

    float denom = d00 * d11 - d01 * d01;

    float v = (d11 * d20 - d01 * d21) / denom;
    float w = (d00 * d21 - d01 * d20) / denom;
    float u = 1.0 - v - w;

    return vec3(u, v, w);
}

vec2 calculateUV(Triangle triangle, vec3 hit) {
    vec3 barycentricCoord = calculateBarycentricCoordinates(triangle, hit);
    vec2 uv = barycentricCoord[0] * triangle.uvA + barycentricCoord[1] * triangle.uvB + barycentricCoord[2] * triangle.uvC;

    // filtering: repeat
    float u = mod(uv[0], 1.0);
    float v = mod(uv[1], 1.0);

    // filtering: nearest
    // float u = clamp(u, 0.0, 1.0);
    // float v = clamp(v, 0.0, 1.0);

    return vec2(u, v);
}

vec4 mapTexture(Triangle triangle, Material material, vec2 uv) {
    vec4 color = vec4(0.15, 0.15, 0.15, 1.0);

    // multiple images per GL texture
    float x = floor((uv[0] * material.albedoTextureWidth));
    float y = floor((uv[1] * material.albedoTextureHeight));
    float pixelId = x + y * material.albedoTextureWidth;

    if (material.albedoTextureId == 0) {
        color = getColorValueFromTexture(albedoTexture1, pixelId + material.albedoPixelOffset, albedoTextureSize);
    } else if (material.albedoTextureId == 1) {
        color = getColorValueFromTexture(albedoTexture2, pixelId + material.albedoPixelOffset, albedoTextureSize);
    } else if (material.albedoTextureId == 2) {
        color = getColorValueFromTexture(albedoTexture3, pixelId + material.albedoPixelOffset, albedoTextureSize);
    } else if (material.albedoTextureId == 3) {
        color = getColorValueFromTexture(albedoTexture4, pixelId + material.albedoPixelOffset, albedoTextureSize);
    } else if (material.albedoTextureId == 4) {
        color = getColorValueFromTexture(albedoTexture5, pixelId + material.albedoPixelOffset, albedoTextureSize);
    } else if (material.albedoTextureId == 5) {
        color = getColorValueFromTexture(albedoTexture6, pixelId + material.albedoPixelOffset, albedoTextureSize);
    } else if (material.albedoTextureId == 6) {
        color = getColorValueFromTexture(albedoTexture7, pixelId + material.albedoPixelOffset, albedoTextureSize);
    }

    return color;
}

BoundingBox pop() {
    stackPointer = stackPointer - 1;

    return fetchBoundingBox(stack[stackPointer]);
}

void push(int node) {
    stack[stackPointer] = node;
    stackPointer = stackPointer + 1;
}

Intersection intersectPrimitives(Ray ray, bool isShadowRay) {
    Intersection intersection;
    intersection.t = INFINITY;

    Ray invertedRay;
    invertedRay.origin = ray.origin;
    invertedRay.direction = vec3(1.0 / ray.direction.x, 1.0 / ray.direction.y, 1.0 / ray.direction.z);
    invertedRay.t = intersection.t;

    float tmin;
    stackPointer = 0;
    BoundingBox node = fetchBoundingBox(0); // BVH root node

    if (isIntersectingBoundingBox(invertedRay, node, tmin)) {
        while (true) {

            // DEBUG: visualize each bounding box
            // if (true) {
            //     pixelColor = pixelColor + vec4(0.05, 00, 0.0, 1.0);
            // }

            if (node.isLeaf) {
                // DEBUG: visualize leaf bounding boxes
                // if (true) {
                //     pixelColor = pixelColor + vec4(0.0, 0.1, 0.0, 1.0);
                // }

                for (int i = 0; i < node.count; i++) {
                    int index = fetchTriangleIndex(node.first + i);

                    Triangle triangle = fetchTriangle(index);
                    float tTriangle = intersectTriangle(ray, triangle);

                    if (tTriangle < intersection.t) {
                        vec3 hit = ray.origin + ray.direction * tTriangle;
                        vec2 uv = vec2(0.0);
                        Material material = fetchMaterial(triangle.materialID);

                        if (material.hasAlbedoTexture) {
                            uv = calculateUV(triangle, hit);

                            // ignore intersection if alpha pixel was hit
                            if (material.hasAlpha) {
                                vec4 textureColor = mapTexture(triangle, material, uv);
                                if (textureColor[3] <= EPSILON) {
                                    continue;
                                }
                            }
                        }
                        intersection.t = tTriangle;

                        // early out if shadowRay already hit any primitive
                        if (isShadowRay && tTriangle < ray.t) {
                            // return intersection;
                            stackPointer = 0;
                        }
                        
                        intersection.hit = hit;
                        intersection.uv = uv;
                        intersection.triangle = triangle;
                        intersection.material = material;

                        invertedRay.t = intersection.t;
                    }
                }
            } else {
                // determine which child to traverse first
                BoundingBox leftChild = fetchBoundingBox(node.left);
                BoundingBox rightChild = fetchBoundingBox(node.right);

                float tLeft = 0.0, tRight = 0.0;
                bool hitLeft = isIntersectingBoundingBox(invertedRay, leftChild, tLeft);
                bool hitRight = isIntersectingBoundingBox(invertedRay, rightChild, tRight);

                if (hitLeft && !hitRight) {
                    node = leftChild;
                    continue;
                } else if (hitRight && !hitLeft) {
                    node = rightChild;
                    continue;
                } else if (hitLeft && hitRight) {
                    if (tRight >= tLeft) {
                        push(node.right);
                        node = leftChild;
                        continue;
                    }

                    push(node.left);
                    node = rightChild;
                    continue;
                }
            }
            
            if (stackPointer <= 0 || stackPointer > STACK_SIZE) {
                break;
            }
            node = pop();
        }
    }

    return intersection;
}

bool isOccluded(Ray ray) {
    Intersection intersection = intersectPrimitives(ray, true);

    if (intersection.t < ray.t) {
        return true;
    }

    return false;
}

vec3 sampleSkydome(Ray ray) {
    vec3 color = vec3(0.25);
    float u = mod(0.5 * (1.0 + atan(ray.direction.z, -ray.direction.x) * INVERSE_PI), 1.0);
    float v = acos(ray.direction.y) * INVERSE_PI;

    int pixelId = int(u * float(skydomeWidth)) + (int(v * float(skydomeHeight)) * skydomeWidth);

    float textureId = floor(float(pixelId) / (skydomeTextureSize * skydomeTextureSize));
    float offset = mod(float(pixelId), skydomeTextureSize * skydomeTextureSize);

    if (abs(textureId - 0.0) <= EPSILON) {
        color = getValueFromTexture(skydomeTexture1, offset, skydomeTextureSize);
    } else if (abs(textureId - 1.0) <= EPSILON) {
        color = getValueFromTexture(skydomeTexture2, offset, skydomeTextureSize);
    } else if (abs(textureId - 2.0) <= EPSILON) {
        color = getValueFromTexture(skydomeTexture3, offset, skydomeTextureSize);
    } else if (abs(textureId - 3.0) <= EPSILON) {
        color = getValueFromTexture(skydomeTexture4, offset, skydomeTextureSize);
    }

    return color;
}

// MIS
float potentialLightContribution(Light light, vec3 hit, vec3 normal) {
    vec3 L = light.position - hit;
    float NdotL = max(0.0, dot( normal, L ) );
    float att = 1.0 / dot( L, L );
    
    return /*POINTLIGHT_ENERGY * */NdotL * att;
}

float[SMALL_STACK_SIZE] calculateLightPotentials(vec3 hit, vec3 normal, out float totalPotential) {
    float potentials[SMALL_STACK_SIZE];

    for (int i = 0; i < totalLights; i++) {
        float c = potentialLightContribution(fetchLight(i), hit, normal);
        totalPotential += c;
        potentials[i] = c;
    }

    return potentials;
}

float lightPickProbability(int lightID, float potentials[SMALL_STACK_SIZE], float totalPotential) {
    float lightPickProb = 0.0;

    if (totalPotential <= 0.0) {
        lightPickProb = 0.0;
    } else {
        lightPickProb = potentials[lightID] / totalPotential; // float lightPickProb = 1.0 / float(totalLights);
    }

    return lightPickProb;
}

Light pickPotentialLight(float potentials[SMALL_STACK_SIZE], float totalPotential) {
    float sum = 0.0;
    uint uSeed = unifySeed(hostSeed);
    float r = totalPotential * randomFloat(uSeed);
	for (int i = 0; i < totalLights; i++) {
		sum += potentials[i];
		if (sum >= r) {
            return fetchLight(i);
        }
	}

    return fetchLight(0);
}
//

vec3 calculateColor(Ray ray) {
    vec3 accumulatedColor = vec3(0.0);
    vec3 surfaceColor = vec3(0.15);
    vec3 lightColor = vec3(1.0, 1.0, 0.85);
    vec3 throughput = vec3(1.0);
    vec3 lastNormal = vec3(0.0);
    float bsdfPdf = 1.0;

    for (int bounce = 0; bounce < BOUNCES; bounce++) {
        float t = INFINITY;
        vec3 hit, normal;

        // ray-primitive intersection
        Intersection intersection = intersectPrimitives(ray, false);
        if (intersection.t < t) {
            t = intersection.t;
            hit = intersection.hit;
            normal = intersection.triangle.normal;//getTriangleNormal(intersection.triangle);

            if (intersection.material.hasAlbedoTexture) {
                surfaceColor = mapTexture(intersection.triangle, intersection.material, intersection.uv).rgb;// * intersection.material.baseColor;
            } else {
                surfaceColor = intersection.material.baseColor;
            }
        }

        // ray-light intersection
        float tLight = INFINITY;
        for (int i = 0; i < totalLights; i++) {
            Light light = fetchLight(i);
            tLight = intersectSphere(ray, Sphere(light.position, light.radius));
            
            // light-hit: apply MIS
            if (tLight < t) {
                vec3 lightNormal = hit - light.position; // LH2: N
                float DdotNL = -dot(ray.direction, lightNormal);

                // if (DdotNL > 0.0) { /* double sided check is irrelevant for spherical lights */
                    float lightArea = 4.0 * PI * light.radius * light.radius;
                    float lightPdf = (tLight * tLight) / (DdotNL * lightArea);

                    float totalPotential = 0.0;
                    float[] potentials = calculateLightPotentials(hit, lastNormal, totalPotential);
                    float lightPickProb = lightPickProbability(i, potentials, totalPotential);

                    vec3 contribution;
                    if ((bsdfPdf + lightPdf * lightPickProb) > 0.0) {
                        contribution = throughput * lightColor * (1.0 / (bsdfPdf + lightPdf * lightPickProb));
                    } else {
                        contribution = throughput * lightColor * (1.0 / (bsdfPdf + lightPdf));
                    }

                    accumulatedColor += clampColor(contribution);
                // }
                break;
            }
        }
        
        // no-hit: sample skydome if loaded
        if (abs(t - INFINITY) <= EPSILON) {
            if (isSkydomeLoaded) {
                accumulatedColor += clampColor(throughput * sampleSkydome(ray) * (1.0 / bsdfPdf));
            }
            break;
        }

        // apply postponed bsdf pdf
        throughput *= 1.0 / bsdfPdf;

        // primitive-hit: apply NEE
        float totalPotential = 0.0;
        float[] potentials = calculateLightPotentials(hit, normal, totalPotential);
        Light light = pickPotentialLight(potentials, totalPotential);
        
		vec3 L = hit - light.position;
		float lightPdf = dot(L, normal) < 0.0 ? dot(L, L) : 0.0;
        float lightPickProb = lightPickProbability(light.id, potentials, totalPotential); // float lightPickProb = 1.0 / float(totalLights);

        L = light.position - hit;
        float dist = length(L);
        L *= 1.0 / dist;
        float NdotL = dot(L, normal);
        if (NdotL > 0.0 /*&& dot(normal, L) >= EPSILON*/ && lightPdf > 0.0) {
			float pdf = abs(NdotL) * INVERSE_PI;
			if (pdf > 0.0) {
				vec3 contribution = throughput * surfaceColor * INVERSE_PI * lightColor * light.intensity * NdotL / (lightPickProb * lightPdf + pdf);

                Ray shadowRay = Ray(safeOrigin(hit, L, normal), L, dist);
                if (!isOccluded(shadowRay)) {
                    accumulatedColor += clampColor(contribution);
                }
			}
		}

        // shoot a new ray
        ray.direction = cosineWeightedDirection(hostSeed + uint(bounce), normal);
        ray.origin = safeOrigin(hit, ray.direction, normal);

        // calculate new bsdf & adjust throughput
        float theta = dot(ray.direction, normal);
        if (theta < EPSILON) {
            break;
        }
        bsdfPdf = max(0.0, theta) * INVERSE_PI;
        throughput = throughput * surfaceColor * INVERSE_PI;
        lastNormal = normal;
    }
    
    return clampColor(accumulatedColor);
}

void main() {
    Ray ray;
    ray.origin = eye;
    ray.direction = normalize(initialRay);

    vec3 color = texture(outputTexture, gl_FragCoord.xy / resolution).rgb;
    pixelColor = vec4(mix(calculateColor(ray), color, textureWeight), 1.0);

    // DEBUG mode
    // vec4(mix(calculateColor(eye, initialRay), color, textureWeight), 1.0);
}