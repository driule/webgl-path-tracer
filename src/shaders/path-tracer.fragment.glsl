#version 300 es

@import ./common/precisions;

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
uniform sampler2D textureSampler;

// geometry
uniform float triangleDataTextureSize;
uniform sampler2D triangleDataTexture;

// bvh
uniform float bvhDataTextureSize;
uniform sampler2D bvhDataTexture;

int stackPointer;
int stack[STACK_SIZE];

// texturing
uniform sampler2D materialsTexture;
uniform float materialsTextureSize;

// ToDo: encode all image textures inside one texture
uniform sampler2D textureImage1;
uniform sampler2D textureImage2;
uniform sampler2D textureImage3;
uniform sampler2D textureImage4;
uniform sampler2D textureImage5;
uniform sampler2D textureImage6;
uniform sampler2D textureImage7;
uniform sampler2D textureImage8;
uniform sampler2D textureImage9;
uniform sampler2D textureImage10;

// skydome
uniform bool isSkydomeLoaded;
uniform float skydomeTextureSize;
uniform sampler2D skydomeTexture;
uniform int skydomeWidth;
uniform int skydomeHeight;

// lights
uniform int totalLights;
uniform float lightDataTextureSize;
uniform sampler2D lightDataTexture;

vec3 getValueFromTexture(sampler2D sampler, float index, float size) {
	ivec2 uv = ivec2(
        mod(index, size),
        floor(index / size)
    );
	
	return texelFetch(sampler, uv, 0).rgb;
}

Triangle fetchTriangle(int id) {
    vec3 coordA = getValueFromTexture(triangleDataTexture, float(id * 6 + 0), triangleDataTextureSize);
    vec3 coordB = getValueFromTexture(triangleDataTexture, float(id * 6 + 1), triangleDataTextureSize);
    vec3 coordC = getValueFromTexture(triangleDataTexture, float(id * 6 + 2), triangleDataTextureSize);
    
    vec3 uv1 = getValueFromTexture(triangleDataTexture, float(id * 6 + 3), triangleDataTextureSize);
    vec3 uv2 = getValueFromTexture(triangleDataTexture, float(id * 6 + 4), triangleDataTextureSize);

    vec3 material = getValueFromTexture(triangleDataTexture, float(id * 6 + 5), triangleDataTextureSize);
    
    Triangle triangle;
    triangle.a = coordA;
    triangle.b = coordB;
    triangle.c = coordC;
    triangle.uvA = vec2(uv1[0], uv1[1]);
    triangle.uvB = vec2(uv1[2], uv2[0]);
    triangle.uvC = vec2(uv2[1], uv2[2]);
    triangle.material = int(material[0]);

    return triangle;
}

int fetchTriangleIndex(int id) {
    vec3 triangleIndex = getValueFromTexture(triangleDataTexture, float(id * 6 + 5), triangleDataTextureSize);

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

    BoundingBox boundingBox;
    boundingBox.min = min;
    boundingBox.max = max;
    boundingBox.isLeaf = bool(int(data[0]));
    boundingBox.first = int(data[1]);
    boundingBox.count = int(data[2]);
    boundingBox.left = int(children[0]);
    boundingBox.right = int(children[1]);
    boundingBox.id = int(children[2]);

    return boundingBox;
}

Material fetchMaterial(int id) {
    vec3 color = getValueFromTexture(materialsTexture, float(id * 2 + 0), materialsTextureSize);
    vec3 data = getValueFromTexture(materialsTexture, float(id * 2 + 1), materialsTextureSize);

    Material material;
    material.color = color;
    material.isAlbedoTextureDefined = bool(int(data[0]));
    material.albedoTextureId = int(data[1]);

    return material;
}

float intersectSphere(vec3 origin, vec3 ray, Sphere sphere) {
    vec3 toSphere = origin - sphere.center;
    float a = dot(ray, ray);
    float b = 2.0 * dot(toSphere, ray);
    float c = dot(toSphere, toSphere) - sphere.radius * sphere.radius;
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant > 0.0) {
        float t = (-b - sqrt(discriminant)) / (2.0 * a);
        if (t >= EPSILON) return t;
    }

    return INFINITY;
}

float intersectTriangle(vec3 origin, vec3 ray, Triangle triangle) {
    float t, u, v;

    vec3 ab = triangle.b - triangle.a;
    vec3 ac = triangle.c - triangle.a;
    vec3 pvec = cross(ray, ac);
    float det = dot(ab, pvec);

    float invDet = 1.0 / det;

    vec3 tvec = origin - triangle.a;
    u = dot(tvec, pvec) * invDet;

    if (u < 0.0 || u > 1.0) return INFINITY;

    vec3 qvec = cross(tvec, ab);
    v = dot(ray, qvec) * invDet;
    if (v < 0.0 || u + v > 1.0) return INFINITY;

    t = dot(ac, qvec) * invDet;
    if (t >= EPSILON)
    {
        return t;
    }

    return INFINITY;
}

vec3 getTriangleNormal(Triangle triangle) {
    return normalize(
        cross(triangle.a - triangle.b, triangle.b - triangle.c)
    );
}

bool isIntersectingBoundingBox(vec3 origin, vec3 invertedDirection, BoundingBox boundingBox, Intersection intersection)
{
    float tmin, tmax, txmin, txmax, tymin, tymax, tzmin, tzmax;

    txmin = (boundingBox.min.x - origin.x) * invertedDirection.x;
    txmax = (boundingBox.max.x - origin.x) * invertedDirection.x;

    tymin = (boundingBox.min.y - origin.y) * invertedDirection.y;
    tymax = (boundingBox.max.y - origin.y) * invertedDirection.y;

    tzmin = (boundingBox.min.z - origin.z) * invertedDirection.z;
    tzmax = (boundingBox.max.z - origin.z) * invertedDirection.z;

    tmin = min(txmin, txmax);
    tmax = max(txmin, txmax);

    tmin = max(tmin, min(tymin, tymax));
    tmax = min(tmax, max(tymin, tymax));

    tmin = max(tmin, min(tzmin, tzmax));
    tmax = min(tmax, max(tzmin, tzmax));

    // early out if intersection is further than the last one
    if (tmin > intersection.t)
        return false;

    if (tmax >= EPSILON && tmax >= tmin) {
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

Intersection intersectPrimitives(vec3 origin, vec3 ray)
{
    Intersection intersection;
    intersection.t = INFINITY;

    vec3 invertedRay = vec3(1.0 / ray.x, 1.0 / ray.y, 1.0 / ray.z);

    stackPointer = 0;
    push(0);

    while (true) {
        if (stackPointer <= 0 || stackPointer > STACK_SIZE) break;

        BoundingBox node = pop();

        if (!isIntersectingBoundingBox(origin, invertedRay, node, intersection)) continue;

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
                if (i >= node.count) {
                    break;
                }

                int index = fetchTriangleIndex(node.first + i);

                Triangle triangle = fetchTriangle(index);
                float tTriangle = intersectTriangle(origin, ray, triangle);

                if (tTriangle < intersection.t) {
                    intersection.t = tTriangle;
                    intersection.triangle = triangle;
                }
            }
        } else {
            push(node.left);
            push(node.right);
        }
    }

    return intersection;
}

float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
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

    return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1.0 - u) * normal;
}

vec3 uniformlyRandomDirection(float seed) {
    float u = random(vec3(12.9898, 78.233, 151.7182), seed);
    float v = random(vec3(63.7264, 10.873, 623.6736), seed);
    float z = 1.0 - 2.0 * u;
    float r = sqrt(1.0 - z * z);
    float angle = 6.283185307179586 * v;

    return vec3(r * cos(angle), r * sin(angle), z);
}

vec3 uniformlyRandomVector(float seed) {
    return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));
}

float getShadowIntensity(vec3 origin, vec3 ray) {    
    Intersection intersection = intersectPrimitives(origin, ray);
    if (intersection.t < 1.0) return 0.0;

    return 1.0;
}

Light getRandomLight() {
    for (int i = 0; i < totalLights; i++) {

        // use loop index as a seed to get different number for each iteration
        float randomValue = random(vec3(12.9898, 78.233, 151.7182), timeSinceStart + float(i));

        if (randomValue < float(1.0 / float(totalLights))) {
            return fetchLight(i);
        }
    }

    return fetchLight(0);
}

vec3 sampleSkydome(vec3 ray) {
    float u = mod(0.5 * (1.0 + atan(ray.z, -ray.x) * INVERSE_PI), 1.0);
    float v = acos(ray.y) * INVERSE_PI;

    int pixelId = int(u * float(skydomeWidth)) + (int(v * float(skydomeHeight)) * skydomeWidth);

    return getValueFromTexture(skydomeTexture, float(pixelId), skydomeTextureSize);
}

vec3 calculateBarycentricCoordinates(Triangle triangle, vec3 hit) {
    float invDenom = 1.0 / ((triangle.b[1] - triangle.c[1]) * (triangle.a[0] - triangle.c[0]) + (triangle.c[0] - triangle.b[0]) * (triangle.a[1] - triangle.c[1]));
    
    float u = ((triangle.b[1] - triangle.c[1]) * (hit[0] - triangle.c[0]) + (triangle.c[0] - triangle.b[0]) * (hit[1] - triangle.c[1])) * invDenom;
    float v = ((triangle.c[1] - triangle.a[1]) * (hit[0] - triangle.c[0]) + (triangle.a[0] - triangle.c[0]) * (hit[1] - triangle.c[1])) * invDenom;
    float w = 1.0 - u - v;

    return vec3(u, v, w);
}

vec3 mapTexture(Triangle triangle, Material material, vec3 hit) {
    vec3 barycentricCoord = calculateBarycentricCoordinates(triangle, hit);
    vec2 uv = barycentricCoord[0] * triangle.uvA + barycentricCoord[1] * triangle.uvB + barycentricCoord[2] * triangle.uvC;

    vec3 color = vec3(0.15);
    if (material.albedoTextureId == 0) {
        color = texture(textureImage1, uv).rgb;
    } else if (material.albedoTextureId == 1) {
        color = texture(textureImage2, uv).rgb;
    } else if (material.albedoTextureId == 2) {
        color = texture(textureImage3, uv).rgb;
    } else if (material.albedoTextureId == 3) {
        color = texture(textureImage4, uv).rgb;
    } else if (material.albedoTextureId == 4) {
        color = texture(textureImage5, uv).rgb;
    } else if (material.albedoTextureId == 5) {
        color = texture(textureImage6, uv).rgb;
    } else if (material.albedoTextureId == 6) {
        color = texture(textureImage7, uv).rgb;
    } else if (material.albedoTextureId == 7) {
        color = texture(textureImage8, uv).rgb;
    } else if (material.albedoTextureId == 8) {
        color = texture(textureImage9, uv).rgb;
    } else if (material.albedoTextureId == 9) {
        color = texture(textureImage10, uv).rgb;
    }

    return color;
}

vec3 calculateColor(vec3 origin, vec3 ray) {
    ray = normalize(ray);

    vec3 accumulatedColor = vec3(0.0);
    vec3 surfaceColor = vec3(0.15);
    vec3 lightColor = vec3(1.0, 1.0, 0.85);
    vec3 colorMask = vec3(1.0);

    Light light;
    float energyMultiplier = 1.0;

    for (int bounce = 0; bounce < BOUNCES; bounce++) {
        float t = INFINITY;
        vec3 normal;
        vec3 hit = origin + ray * t;

        Intersection intersection = intersectPrimitives(origin, ray);
        if (intersection.t < t) {
            t = intersection.t;
            hit = origin + ray * t;
            normal = getTriangleNormal(intersection.triangle);

            Material material = fetchMaterial(intersection.triangle.material);
            if (material.isAlbedoTextureDefined) {
                surfaceColor = mapTexture(intersection.triangle, material, hit);
            } else {
                surfaceColor = material.color;
            }
        }

        float tLight = INFINITY;
        for (int i = 0; i < totalLights; i++) {
            light = fetchLight(i);
            tLight = intersectSphere(origin, ray, Sphere(light.position, light.radius));
            
            if (tLight < t) {
                accumulatedColor += colorMask * lightColor;
                break;
            }
        }
        
        if (abs(t - INFINITY) < EPSILON) {
            if (isSkydomeLoaded) {
                accumulatedColor += colorMask * sampleSkydome(ray);
            }
            break;
        } else {
            ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);
        }

        light = getRandomLight();

        vec3 toLight = (light.position + uniformlyRandomVector(timeSinceStart - 50.0) * light.radius) - hit;
        float diffuse = max(0.0, dot(normalize(toLight), normal));
        float shadowIntensity = getShadowIntensity(hit + normal + EPSILON, toLight);

        // skydome contribution for illumination
        vec3 skydomeColor = vec3(0, 0, 0);
        if (isSkydomeLoaded) {
            skydomeColor += colorMask * sampleSkydome(ray);
        }
        
        colorMask *= surfaceColor;
        accumulatedColor += colorMask * surfaceColor * ((lightColor * light.intensity * diffuse * shadowIntensity) + skydomeColor) * energyMultiplier;
        
        // Russian-Roulette to determine ray survival probability
        float raySurviveProbability = min(1.0, max(max(accumulatedColor.x, accumulatedColor.y), accumulatedColor.z));
        energyMultiplier = 1.0 / raySurviveProbability;

        float randomNumber = random(vec3(12.9898, 78.233, 151.7182), timeSinceStart + float(bounce));
        if (randomNumber > raySurviveProbability) {
            break;
        }

        origin = hit;
    }
    
    return accumulatedColor;
}

void main() {
    vec3 texture = texture(textureSampler, gl_FragCoord.xy / resolution).rgb;
    pixelColor = vec4(mix(calculateColor(eye, initialRay), texture, textureWeight), 1.0);

    // DEBUG mode
    // vec4(mix(calculateColor(eye, initialRay), texture, textureWeight), 1.0);
}