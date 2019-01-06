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

    #define MAX_SPHERES 128
    #define BOUNCES 5
    #define EPSILON 0.0001
    #define INFINITY 10000.0

    struct Sphere
    {
        vec3 center;
        float radius;
    };

    struct Light
    {
        vec3 position;
        float radius;
        float intensity;
    };

    uniform vec3 eye;
    uniform float textureWeight;
    uniform float timeSinceStart;
    uniform sampler2D texture;

    uniform Light light;
    uniform int totalSpheres;
    uniform Sphere spheres[MAX_SPHERES];

    varying vec3 initialRay;

    float intersectSphere(vec3 origin, vec3 ray, Sphere sphere) {
        vec3 toSphere = origin - sphere.center;
        float a = dot(ray, ray);
        float b = 2.0 * dot(toSphere, ray);
        float c = dot(toSphere, toSphere) - sphere.radius * sphere.radius;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant > 0.0) {
            float t = (-b - sqrt(discriminant)) / (2.0 * a);
            if (t > 0.0) return t;
        }

        return INFINITY;
    }

    vec3 getSphereNormal(vec3 hit, Sphere sphere) {
        return (hit - sphere.center) / sphere.radius;
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

        for (int i = 0; i < MAX_SPHERES; i++) {
            if (i >= totalSpheres) break;
            
            float tSpehere = intersectSphere(origin, ray, spheres[i]);
            if (tSpehere < 1.0) return 0.0;
        }
        
        return 1.0;
    }

    vec3 calculateColor(vec3 origin, vec3 ray, Light light) {
        vec3 accumulatedColor = vec3(0.0);
        
        for (int bounce = 0; bounce < BOUNCES; bounce++) {
            float t = INFINITY;
            vec3 normal;
            vec3 hit = origin + ray * t;

            for (int i = 0; i < MAX_SPHERES; i++) {
                if (i >= totalSpheres) break;
                
                float tSpehere = intersectSphere(origin, ray, spheres[i]);
                if (tSpehere < t) {
                    t = tSpehere;
                    hit = origin + ray * t;
                    normal = getSphereNormal(hit, spheres[i]);
                }
            }
            
            if (t == INFINITY) {
                break;
            } else {
                ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);
            }
            
            vec3 surfaceColor = vec3(0.75);

            vec3 toLight = (light.position + uniformlyRandomVector(timeSinceStart) * light.radius) - hit;
            float diffuse = max(0.0, dot(normalize(toLight), normal));
            float shadowIntensity = getShadowIntensity(hit + normal * EPSILON, toLight);
            
            accumulatedColor += surfaceColor * (light.intensity * diffuse * shadowIntensity);
            
            origin = hit;
        }
        
        return accumulatedColor;
    }

    void main() {
        vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;
        gl_FragColor = vec4(mix(calculateColor(eye, initialRay, light), texture, textureWeight), 1.0);
    }
`;

let renderer: LH.Renderer;

window.onload = function() {
    renderer = new LH.Renderer();
    renderer.start();

    let start = Date.now();
    setInterval(function(){ renderer.tick((Date.now() - start) * 0.001); }, 1000 / 60);
}