#version 300 es

@import ./common/precisions;

@import ./common/entities/ray;
@import ./common/entities/material;
@import ./common/entities/sphere;
@import ./common/entities/triangle;
@import ./common/entities/light;
@import ./common/entities/bounding-box;
@import ./common/entities/intersection;

#define EPSILON 0.0001
#define INFINITY 10000.0

#define PI 3.14159
#define INVERSE_PI 1.0 / PI

#define BOUNCES 3
#define STACK_SIZE 256

in vec3 initialRay;
out vec4 pixelColor;

// path tracer settings
uniform vec2 resolution;
uniform vec3 eye;
uniform float textureWeight;
uniform float timeSinceStart;
uniform sampler2D outputTexture; // #0

// geometry
uniform float triangleDataTextureSize;
uniform sampler2D triangleDataTexture; // #1

// lights
uniform int totalLights;
uniform float lightDataTextureSize;
uniform sampler2D lightDataTexture; // #2

// bvh
uniform float bvhDataTextureSize;
uniform sampler2D bvhDataTexture; // #3

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

vec3 getValueFromTexture(sampler2D sampler, float index, float size) {
	ivec2 uv = ivec2(
        mod(index, size),
        floor(index / size)
    );
	
	return texelFetch(sampler, uv, 0).rgb;
}

vec4 getColorValueFromTexture(sampler2D sampler, float index, float size) {
	ivec2 uv = ivec2(
        mod(index, size),
        floor(index / size)
    );
	
	return texelFetch(sampler, uv, 0).rgba;
}

Triangle fetchTriangle(int id) {
    vec3 coordA = getValueFromTexture(triangleDataTexture, float(id * 7 + 0), triangleDataTextureSize);
    vec3 coordB = getValueFromTexture(triangleDataTexture, float(id * 7 + 1), triangleDataTextureSize);
    vec3 coordC = getValueFromTexture(triangleDataTexture, float(id * 7 + 2), triangleDataTextureSize);
    
    vec3 uv1 = getValueFromTexture(triangleDataTexture, float(id * 7 + 3), triangleDataTextureSize);
    vec3 uv2 = getValueFromTexture(triangleDataTexture, float(id * 7 + 4), triangleDataTextureSize);

    vec3 material = getValueFromTexture(triangleDataTexture, float(id * 7 + 5), triangleDataTextureSize);
    vec3 normal = getValueFromTexture(triangleDataTexture, float(id * 7 + 6), triangleDataTextureSize);
    
    Triangle triangle;
    triangle.a = coordA;
    triangle.b = coordB;
    triangle.c = coordC;
    triangle.uvA = vec2(uv1[0], uv1[1]);
    triangle.uvB = vec2(uv1[2], uv2[0]);
    triangle.uvC = vec2(uv2[1], uv2[2]);
    triangle.materialID = int(material[0]);
    triangle.normal = normal;

    return triangle;
}

int fetchTriangleIndex(int id) {
    vec3 triangleIndex = getValueFromTexture(triangleDataTexture, float(id * 7 + 5), triangleDataTextureSize);

    return int(triangleIndex[1]);
}

Light fetchLight(int id) {
    vec3 position = getValueFromTexture(lightDataTexture, float(id * 2), lightDataTextureSize);
    vec3 featureVector = getValueFromTexture(lightDataTexture, float(id * 2 + 1), lightDataTextureSize);

    float radius = featureVector[0];
    float intensity = featureVector[1];
    
    return Light(position, radius, intensity);
}

BoundingBox fetchBoundingBox(int id) {
    vec3 min = getValueFromTexture(bvhDataTexture, float(id * 4 + 0), bvhDataTextureSize);
    vec3 max = getValueFromTexture(bvhDataTexture, float(id * 4 + 1), bvhDataTextureSize);
    vec3 data = getValueFromTexture(bvhDataTexture, float(id * 4 + 2), bvhDataTextureSize);
    vec3 children = getValueFromTexture(bvhDataTexture, float(id * 4 + 3), bvhDataTextureSize);

    // vec3 leftMin = getValueFromTexture(bvhDataTexture, float(id * 8 + 4), bvhDataTextureSize);
    // vec3 leftMax = getValueFromTexture(bvhDataTexture, float(id * 8 + 5), bvhDataTextureSize);
    // vec3 rightMin = getValueFromTexture(bvhDataTexture, float(id * 8 + 6), bvhDataTextureSize);
    // vec3 rightMax = getValueFromTexture(bvhDataTexture, float(id * 8 + 7), bvhDataTextureSize);

    BoundingBox boundingBox;
    boundingBox.min = min;
    boundingBox.max = max;
    boundingBox.isLeaf = bool(data[0]);
    boundingBox.first = int(data[1]);
    boundingBox.count = int(data[2]);
    boundingBox.left = int(children[0]);
    boundingBox.right = int(children[1]);
    boundingBox.id = int(children[2]);

    // boundingBox.leftMin = leftMin;
    // boundingBox.leftMax = leftMax;
    // boundingBox.rightMin = rightMin;
    // boundingBox.rightMax = rightMax;

    boundingBox.isProcessed = false;

    return boundingBox;
}

Material fetchMaterial(int id) {
    vec3 color = getValueFromTexture(materialsTexture, float(id * 3 + 0), materialsTextureSize);
    vec3 data = getValueFromTexture(materialsTexture, float(id * 3 + 1), materialsTextureSize);
    vec3 albedoTextureSize = getValueFromTexture(materialsTexture, float(id * 3 + 2), materialsTextureSize);

    Material material;
    material.color = color;
    material.hasAlbedoTexture = bool(data[0]);
    material.albedoTextureId = int(data[1]);
    material.albedoPixelOffset = data[2];

    material.albedoTextureWidth = albedoTextureSize[0];
    material.albedoTextureHeight = albedoTextureSize[1];
    material.hasAlpha = bool(albedoTextureSize[2]);

    return material;
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

BoundingBox pop() {
    stackPointer = stackPointer - 1;

    return fetchBoundingBox(stack[stackPointer]);
}

void push(int node) {
    stack[stackPointer] = node;
    stackPointer = stackPointer + 1;
}

float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}

vec3 clampColor(vec3 color) {
    float v = max(color.x, max(color.y, color.z));
    if (v > 1.0) {
        color *= 1.0 / v;
    }

    return color;
}

vec3 cosineWeightedDirection(float seed, vec3 normal) {
    float u = random(vec3(12.9898, 78.233, 151.7182), seed);
    float v = random(vec3(63.7264, 10.873, 623.6736), seed);
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

Light getRandomLight() {
    for (int i = 0; i < totalLights; i++) {
        float randomValue = random(vec3(12.9898, 78.233, 151.7182), timeSinceStart + float(i));

        if (randomValue < float(1.0 / float(totalLights))) {
            return fetchLight(i);
        }
    }

    return fetchLight(0);
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

Intersection intersectPrimitives(Ray ray, bool isShadowRay) {
    Intersection intersection;
    intersection.t = INFINITY;

    Ray invertedRay;
    invertedRay.origin = ray.origin;
    invertedRay.direction = vec3(1.0 / ray.direction.x, 1.0 / ray.direction.y, 1.0 / ray.direction.z);
    invertedRay.t = intersection.t;

    stackPointer = 0;
    BoundingBox node = fetchBoundingBox(0); // BVH root node

    float tmin = 0.0;
    if (!isIntersectingBoundingBox(invertedRay, node, tmin)) {
        node.isProcessed = true;
    }

    while (true) {
        if (node.isProcessed && (stackPointer <= 0 || stackPointer > STACK_SIZE)) {
            break;
        }

        if (node.isProcessed && stackPointer > 0) {
            node = pop();
        }

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
                        return intersection;
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
        node.isProcessed = true;
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

vec3 safeOrigin(vec3 origin, vec3 direction, vec3 normal) {
	float parallel = 1.0 - abs(dot(normal, direction));
	float v = parallel * parallel;

	return origin + direction * EPSILON * (1.0 - v) + normal * EPSILON * v;
}

vec3 calculateColor(Ray ray) {
    vec3 accumulatedColor = vec3(0.0);
    vec3 surfaceColor = vec3(0.15);
    vec3 lightColor = vec3(1.0, 1.0, 0.85);

    vec3 throughput = vec3(1.0);
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
                surfaceColor = mapTexture(intersection.triangle, intersection.material, intersection.uv).rgb;// * intersection.material.color;
            } else {
                surfaceColor = intersection.material.color;
            }
        }

        // PORT FROM: lights_shared.cu
        // calculate light pdf and pick probability
        Light light = getRandomLight();
		vec3 L = hit - light.position;
		float lightPdf = dot(L, normal) < 0.0 ? dot(L, L) : 0.0;
        float pickProb = 1.0 / float(totalLights);

        // ray-light intersection
        float tLight = INFINITY;
        for (int i = 0; i < totalLights; i++) {
            Light light = fetchLight(i);
            tLight = intersectSphere(ray, Sphere(light.position, light.radius));
            
            if (tLight < t) {
                // hit light, apply MIS         
                vec3 contribution;
                if ((bsdfPdf + lightPdf * pickProb) > 0.0) {
                    contribution = throughput * lightColor * (1.0 / (bsdfPdf + lightPdf * pickProb));
                } else {
                    contribution = throughput * lightColor * (1.0 / (bsdfPdf + lightPdf));
                }

                accumulatedColor += clampColor(contribution);
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
        throughput *= 1.0f / bsdfPdf;

        // PORT FROM: pathtracer.cu
        // shading
        L = light.position - hit;
        float dist = length(L);
        L *= 1.0 / dist;
        float NdotL = dot(L, normal);
        if (NdotL >= EPSILON && dot(normal, L) >= EPSILON && lightPdf >= EPSILON)
		{
			float pdf = abs(dot(L, normal)) * INVERSE_PI;
			if (pdf >= EPSILON)
			{
				vec3 contribution = throughput * surfaceColor * INVERSE_PI * lightColor * light.intensity * NdotL / (pickProb * lightPdf + pdf);

                Ray shadowRay;
                shadowRay.origin = safeOrigin(hit, L, normal);
                shadowRay.direction = L;
                shadowRay.t = dist;
                if (!isOccluded(shadowRay)) {
                    accumulatedColor += clampColor(contribution);
                }
			}
		}

        // shoot a new ray
        ray.direction = cosineWeightedDirection(timeSinceStart + float(bounce), normal);
        ray.origin = safeOrigin(hit, ray.direction, normal);

        // calculate new bsdf & adjust throughput
        float theta = dot(ray.direction, normal);
        if (theta <= EPSILON) {
            break;
        }
        bsdfPdf = max(0.0, theta) * INVERSE_PI;
        throughput = throughput * surfaceColor * INVERSE_PI;
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