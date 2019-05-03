declare var glMatrix: any;

// vertex shader for drawing a textured quad
var renderVertexSource = `
    attribute vec3 vertex;
    varying vec2 texCoord;

    void main() {
        texCoord = vertex.xy * 0.5 + 0.5;
        gl_Position = vec4(vertex, 1.0);
    }
`;

// fragment shader for drawing a textured quad
var renderFragmentSource = `
    precision highp float;

    varying vec2 texCoord;
    uniform sampler2D texture;

    void main() {
        gl_FragColor = texture2D(texture, texCoord);
    }
`;

// vertex shader, interpolate ray per-pixel
var tracerVertexSource = `
    attribute vec3 vertex;
    uniform vec3 eye, ray00, ray01, ray10, ray11;
    varying vec3 initialRay;

    void main() {
        vec2 percent = vertex.xy * 0.5 + 0.5;
        initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);
        gl_Position = vec4(vertex, 1.0);
    }
`;

var tracerFragmentSource = `
    precision highp float;

    #define MAX_TRIANGLES 10000
    #define MAX_LIGHTS 256
    #define BOUNCES 5
    #define EPSILON 0.0001
    #define INFINITY 10000.0

    struct Sphere
    {
        vec3 center;
        float radius;
    };

    struct Triangle
    {
        vec3 a, b, c;
    };

    struct Light
    {
        vec3 position;
        float radius;
        float intensity;
    };

    uniform vec2 resolution;
    uniform vec3 eye;
    uniform float textureWeight;
    uniform float timeSinceStart;
    uniform sampler2D texture;

    // geometry
    uniform int totalTriangles;
    uniform float triangleDataTextureSize;
    uniform sampler2D triangleDataTexture;

    uniform int totalLights;
    uniform float lightDataTextureSize;
    uniform sampler2D lightDataTexture;

    varying vec3 initialRay;

    vec3 getValueFromTexture(sampler2D texture, float index, float size) {
        float column = mod(index, size);
        float row = floor(index / size);

        vec2 uv = vec2((column + 0.5) / size, (row + 0.5) / size);

        return texture2D(texture, uv).rgb;
     }

     Triangle fetchTriangle(int id) {
         vec3 coordA = getValueFromTexture(triangleDataTexture, float(id * 3), triangleDataTextureSize);
         vec3 coordB = getValueFromTexture(triangleDataTexture, float(id * 3 + 1), triangleDataTextureSize);
         vec3 coordC = getValueFromTexture(triangleDataTexture, float(id * 3 + 2), triangleDataTextureSize);
         
         return Triangle(coordA, coordB, coordC);
     }

     Light fetchLight(int id) {
         vec3 position = getValueFromTexture(lightDataTexture, float(id * 3), lightDataTextureSize);
         vec3 featureVector = getValueFromTexture(lightDataTexture, float(id * 3 + 1), lightDataTextureSize);

         float radius = featureVector[0];
         float intensity = featureVector[1];
         
         return Light(position, radius, intensity);
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

    vec3 getTriangleNormal(vec3 hit, Triangle triangle) {
        return normalize(
            cross(triangle.a - triangle.b, triangle.b - triangle.c)
        );
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
        for (int i = 0; i < MAX_TRIANGLES; i++) {
            if (i >= totalTriangles) break;
            
            float tTriangle = intersectTriangle(
                origin,
                ray,
                fetchTriangle(i)
            );
            if (tTriangle < 1.0) return 0.0;
        }
        
        return 1.0;
    }

    Light getRandomLight() {
        for (int i = 0; i < MAX_LIGHTS; i++) {

            // use loop index as a seed to get different number for each iteration
            float randomValue = random(vec3(12.9898, 78.233, 151.7182), timeSinceStart + float(i));

            if (randomValue < float(1.0 / float(totalLights))) {
                return fetchLight(i);
            }
        }

        return fetchLight(0);
    }

    vec3 calculateColor(vec3 origin, vec3 ray) {
        vec3 accumulatedColor = vec3(0.0);
        vec3 surfaceColor = vec3(0.75);
        vec3 lightColor = vec3(1.0, 1.0, 0.85);
        vec3 colorMask = vec3(1.0);

        Light light;
        
        for (int bounce = 0; bounce < BOUNCES; bounce++) {
            float t = INFINITY;
            vec3 normal;
            vec3 hit = origin + ray * t;

            for (int i = 0; i < MAX_TRIANGLES; i++) {
                if (i >= totalTriangles) break;

                Triangle triangle = fetchTriangle(i);
                float tTriangle = intersectTriangle(origin, ray, triangle);
                if (tTriangle < t) {
                    t = tTriangle;
                    hit = origin + ray * t;
                    normal = getTriangleNormal(hit, triangle);
                    surfaceColor = vec3(0.25, 0.00, 0.00);
                }
            }

            float tLight = INFINITY;
            for (int i = 0; i < MAX_LIGHTS; i++) {
                if (i >= totalLights) break;

                light = fetchLight(i);
                tLight = intersectSphere(origin, ray, Sphere(light.position, light.radius));
                
                if (tLight < t) {
                    accumulatedColor += colorMask * lightColor;
                    break;
                }
            }
            
            if (t == INFINITY || tLight < t) {
                break;
            } else {
                ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);
            }

            light = getRandomLight();

            vec3 toLight = (light.position + uniformlyRandomVector(timeSinceStart - 50.0) * light.radius) - hit;
            float diffuse = max(0.0, dot(normalize(toLight), normal));
            float shadowIntensity = getShadowIntensity(hit + normal * EPSILON, toLight);
            
            colorMask *= surfaceColor;
            accumulatedColor += colorMask * surfaceColor * (lightColor * light.intensity * diffuse * shadowIntensity);
            
            origin = hit;
        }
        
        return accumulatedColor;
    }

    void main() {
        vec3 texture = texture2D(texture, gl_FragCoord.xy / resolution).rgb;
        gl_FragColor = vec4(mix(calculateColor(eye, initialRay), texture, textureWeight), 1.0);
    }
`;

let renderer: LH.Renderer;

// fps measurement
var lastTick: number = Date.now();
var fps: number = 0;
var elapsedTime = 0;
var frameCount = 0;

var primitiveCount = 0;

window.onload = function() {
    renderer = new LH.Renderer();
    renderer.start();

    let start = Date.now();
    renderer.tick(Date.now() - start);

    // TODO: always use requestAnimationFrame() over setInterval()
    //setInterval(function(){ renderer.tick((Date.now() - start) * 0.001); }, 1000 / 60);

    var fpsLabel = document.getElementById('fps');
    var primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function() {
        fpsLabel.innerHTML = fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = primitiveCount + " primitives loaded";
    }, 200);
}

document.onkeydown = function(event) {

    // W
    if (event.keyCode == 87) {
        renderer.moveUp();
    }

    // S
    if (event.keyCode == 83) {
        renderer.moveDown();
    }

    // A
    if (event.keyCode == 65) {
        renderer.moveLeft();
    }

    // D
    if (event.keyCode == 68) {
        renderer.moveRight();
    }

    // -
    if (event.keyCode == 189 || event.keyCode == 109) {
        renderer.zoomOut();
    }

    // +
    if (event.keyCode == 187 || event.keyCode == 107) {
        renderer.zoomIn();
    }
};