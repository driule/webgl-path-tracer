// entry point

declare var Vector: any;
declare var Matrix: any;

////////////////////////////////////////////////////////////////////////////////
// shader strings
////////////////////////////////////////////////////////////////////////////////

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

// constants for the shaders
var bounces = 5;
var epsilon = 0.0001;
var infinity = '10000.0';
var lightSize = 100.5;
var lightVal = 100.00;

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

// start of fragment shader
var tracerFragmentSourceHeader = `
    precision highp float;

    #define MAX_SPHERES 128

    struct Sphere
    {
        vec3 center;
        float radius;
    };

    uniform vec3 eye;
    uniform float textureWeight;
    uniform float timeSinceStart;
    uniform sampler2D texture;
    uniform float glossiness;

    uniform vec3 light;
    uniform int totalSpheres;
    uniform Sphere spheres[MAX_SPHERES];

    varying vec3 initialRay;
`;

// compute the near intersection of a sphere
// no intersection returns a value of +infinity
var intersectSphereSource = `
    float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {
        vec3 toSphere = origin - sphereCenter;
        float a = dot(ray, ray);
        float b = 2.0 * dot(toSphere, ray);
        float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;
        float discriminant = b * b - 4.0 * a * c;

        if (discriminant > 0.0) {
            float t = (-b - sqrt(discriminant)) / (2.0 * a);
            if (t > 0.0) return t;
        }

        return ` + infinity + `;
    }
`;

// given that hit is a point on the sphere, what is the surface normal?
var normalForSphereSource = `
    vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) {
        return (hit - sphereCenter) / sphereRadius;
    }
`;

// use the fragment position for randomness
var randomSource = `
    float random(vec3 scale, float seed) {
        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }
`;

// random cosine-weighted distributed vector
// from http://www.rorydriscoll.com/2009/01/07/better-sampling/
var cosineWeightedDirectionSource = `
    vec3 cosineWeightedDirection(float seed, vec3 normal) {
        float u = random(vec3(12.9898, 78.233, 151.7182), seed);
        float v = random(vec3(63.7264, 10.873, 623.6736), seed);
        float r = sqrt(u);
        float angle = 6.283185307179586 * v;

        // compute basis from normal
        vec3 sdir, tdir;
        if (abs(normal.x) < 0.5) {
            sdir = cross(normal, vec3(1, 0, 0));
        } else {
            sdir = cross(normal, vec3(0, 1, 0));
        }
        tdir = cross(normal, sdir);

        return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1.0 - u) * normal;
    }
`;

// random normalized vector
var uniformlyRandomDirectionSource = `
    vec3 uniformlyRandomDirection(float seed) {
        float u = random(vec3(12.9898, 78.233, 151.7182), seed);
        float v = random(vec3(63.7264, 10.873, 623.6736), seed);
        float z = 1.0 - 2.0 * u;
        float r = sqrt(1.0 - z * z);
        float angle = 6.283185307179586 * v;

        return vec3(r * cos(angle), r * sin(angle), z);
    }
`;

// random vector in the unit sphere
// note: this is probably not statistically uniform, saw raising to 1/3 power somewhere but that looks wrong?
var uniformlyRandomVectorSource = `
    vec3 uniformlyRandomVector(float seed) {
        return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));
    }
`;

// compute specular lighting contribution
var specularReflection = `
    vec3 reflectedLight = normalize(reflect(light - hit, normal));
    specularHighlight = max(0.0, dot(reflectedLight, normalize(hit - origin)));
`;

// update ray using normal and bounce according to a diffuse reflection
var newDiffuseRay = `
    ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);
`;

// update ray using normal according to a specular reflection
var newReflectiveRay = `
    ray = reflect(ray, normal);
    ` + specularReflection + `
    specularHighlight = 2.0 * pow(specularHighlight, 20.0);
`;

// update ray using normal and bounce according to a glossy reflection
var newGlossyRay = `
    ray = normalize(reflect(ray, normal)) + uniformlyRandomVector(timeSinceStart + float(bounce)) * glossiness;
    ` + specularReflection + `
    specularHighlight = pow(specularHighlight, 3.0);
`;

var shadowSource = `
    float shadow(vec3 origin, vec3 ray) {

        for (int i = 0; i < MAX_SPHERES; i++) {
            if (i >= totalSpheres) break;
            float tSpehere = intersectSphere(origin, ray, spheres[i].center, spheres[i].radius);
            if (tSpehere < 1.0) return 0.0;
        }
        
        return 1.0;
    }
`;

var calculateColorSource = `
    vec3 calculateColor(vec3 origin, vec3 ray, vec3 light) {
        vec3 colorMask = vec3(1.0);
        vec3 accumulatedColor = vec3(0.0);
        for (int bounce = 0; bounce < 5; bounce++) {
            float t = 10000.0;
            vec3 normal;
            vec3 hit = origin + ray * t;

            for (int i = 0; i < MAX_SPHERES; i++) {
                if (i >= totalSpheres) break;
                
                float tSpehere = intersectSphere(origin, ray, spheres[i].center, spheres[i].radius);
                if (tSpehere < t) {
                    t = tSpehere;
                    hit = origin + ray * t;
                    normal = normalForSphere(hit, spheres[i].center, spheres[i].radius);
                }
            }
            
            if (t == 10000.0) {
                break;
            } else {
                ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);
            }
            
            vec3 surfaceColor = vec3(0.75);
            float specularHighlight = 0.0;

            vec3 toLight = light - hit;
            float diffuse = max(0.0, dot(normalize(toLight), normal));
            float shadowIntensity = shadow(hit + normal * 0.0001, toLight);
            colorMask *= surfaceColor;
            
            accumulatedColor += colorMask * (0.5 * diffuse * shadowIntensity);
            accumulatedColor += colorMask * specularHighlight * shadowIntensity;
            
            origin = hit;
        }
        
        return accumulatedColor;
    }
`;

var renderMainSource = `
    void main() {
        vec3 newLight = light + uniformlyRandomVector(timeSinceStart - 53.0) * ` + lightSize + `;
        vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;
        gl_FragColor = vec4(mix(calculateColor(eye, initialRay, newLight), texture, textureWeight), 1.0);
    }
`;

function makeTracerFragmentSource() {
    return tracerFragmentSourceHeader +
        intersectSphereSource +
        normalForSphereSource +
        randomSource +
        cosineWeightedDirectionSource +
        uniformlyRandomDirectionSource +
        uniformlyRandomVectorSource +
        shadowSource +
        calculateColorSource + 
        renderMainSource
    ;
}

////////////////////////////////////////////////////////////////////////////////
// utility functions
////////////////////////////////////////////////////////////////////////////////

function concat(objects, func) {
    var text = '';
    for(var i = 0; i < objects.length; i++) {
        text += func(objects[i]);
    }

    return text;
}

Vector.prototype.ensure3 = function() {
    return Vector.create([this.elements[0], this.elements[1], this.elements[2]]);
};

Vector.prototype.ensure4 = function(w) {
    return Vector.create([this.elements[0], this.elements[1], this.elements[2], w]);
};

Vector.prototype.divideByW = function() {
    var w = this.elements[this.elements.length - 1];
    var newElements = [];
    for(var i = 0; i < this.elements.length; i++) {
        newElements.push(this.elements[i] / w);
    }

    return Vector.create(newElements);
};

Vector.prototype.componentDivide = function(vector) {
    if(this.elements.length != vector.elements.length) {
        return null;
    }
    var newElements = [];
    for(var i = 0; i < this.elements.length; i++) {
        newElements.push(this.elements[i] / vector.elements[i]);
    }

    return Vector.create(newElements);
};

Vector.min = function(a, b) {
    if(a.length != b.length) {
        return null;
    }
    var newElements = [];
    for(var i = 0; i < a.elements.length; i++) {
        newElements.push(Math.min(a.elements[i], b.elements[i]));
    }

    return Vector.create(newElements);
};

Vector.max = function(a, b) {
    if(a.length != b.length) {
        return null;
    }
    var newElements = [];
    for(var i = 0; i < a.elements.length; i++) {
        newElements.push(Math.max(a.elements[i], b.elements[i]));
    }

    return Vector.create(newElements);
};

Vector.prototype.minComponent = function() {
    var value = Number.MAX_VALUE;
    for(var i = 0; i < this.elements.length; i++) {
        value = Math.min(value, this.elements[i]);
    }

    return value;
};

Vector.prototype.maxComponent = function() {
    var value = -Number.MAX_VALUE;
    for(var i = 0; i < this.elements.length; i++) {
        value = Math.max(value, this.elements[i]);
    }

    return value;
};

Matrix.Translation = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////

var nextObjectId = 0;

var MATERIAL_DIFFUSE = 0;
var MATERIAL_MIRROR = 1;
var MATERIAL_GLOSSY = 2;
var material = MATERIAL_DIFFUSE;
var glossiness = 0.6;

var YELLOW_BLUE_CORNELL_BOX = 0;
var RED_GREEN_CORNELL_BOX = 1;
var environment = YELLOW_BLUE_CORNELL_BOX;

let renderer: LH.Renderer;

window.onload = function() {
    renderer = new LH.Renderer();
    renderer.start();
}