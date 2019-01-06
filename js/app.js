var LH;
(function (LH) {
    var PathTracer = /** @class */ (function () {
        function PathTracer() {
            // create framebuffer
            this.framebuffer = LH.gl.createFramebuffer();
            // create textures
            var type = LH.gl.getExtension('OES_texture_float') ? LH.gl.FLOAT : LH.gl.UNSIGNED_BYTE;
            this.textures = [];
            for (var i = 0; i < 2; i++) {
                this.textures.push(LH.gl.createTexture());
                LH.gl.bindTexture(LH.gl.TEXTURE_2D, this.textures[i]);
                LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB, 512, 512, 0, LH.gl.RGB, type, null);
            }
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, null);
            // create render shader
            this.renderShader = new LH.Shader('render', renderVertexSource, renderFragmentSource);
            var renderVertexAttribute = new LH.AttributeInformation();
            renderVertexAttribute.location = this.renderShader.getAttributeLocation('vertex');
            renderVertexAttribute.offset = 0;
            renderVertexAttribute.size = 2;
            this.vertexBuffer = new LH.GLBuffer(2, LH.gl.FLOAT, LH.gl.ARRAY_BUFFER, LH.gl.TRIANGLE_STRIP);
            this.vertexBuffer.pushBackData([
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ]);
            this.vertexBuffer.addAttributeLocation(renderVertexAttribute);
            // objects and shader will be filled in when setObjects() is called
            this.spheres = [];
            this.light = null;
            this.sampleCount = 0;
            this.tracerShader = null;
        }
        PathTracer.prototype.setObjects = function (spheres, light) {
            this.uniforms = {};
            this.sampleCount = 0;
            this.spheres = spheres;
            this.light = light;
            // create tracer shader
            if (this.tracerShader != null) {
                this.tracerShader.delete();
            }
            this.tracerShader = new LH.Shader('tracer', tracerVertexSource, tracerFragmentSource);
        };
        PathTracer.prototype.update = function (matrix, timeSinceStart, eye) {
            // calculate uniforms
            this.uniforms.eye = eye;
            this.uniforms.ray00 = this.getEyeRay(matrix, -1, -1, eye);
            this.uniforms.ray01 = this.getEyeRay(matrix, -1, +1, eye);
            this.uniforms.ray10 = this.getEyeRay(matrix, +1, -1, eye);
            this.uniforms.ray11 = this.getEyeRay(matrix, +1, +1, eye);
            this.uniforms.timeSinceStart = timeSinceStart;
            this.uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);
            // light uniforms
            this.uniforms.light = this.light._position;
            // spheres uniforms
            this.uniforms.totalSpheres = this.spheres.length;
            this.uniforms.spheres = this.spheres;
            // set uniforms
            this.tracerShader.use();
            this.tracerShader.setUniforms(this.uniforms);
            // render to texture
            this.tracerShader.use();
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this.textures[0]);
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, this.framebuffer);
            LH.gl.framebufferTexture2D(LH.gl.FRAMEBUFFER, LH.gl.COLOR_ATTACHMENT0, LH.gl.TEXTURE_2D, this.textures[1], 0);
            this.vertexBuffer.upload();
            this.vertexBuffer.draw();
            // ping pong textures
            this.textures.reverse();
            this.sampleCount++;
        };
        PathTracer.prototype.render = function () {
            this.renderShader.use();
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, null);
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this.textures[0]);
            this.vertexBuffer.draw();
        };
        PathTracer.prototype.getEyeRay = function (matrix, x, y, eye) {
            var transformedVector = glMatrix.vec4.transformMat4([], [x, y, 0, 1], matrix);
            var scaledVector = glMatrix.vec4.scale([], transformedVector, 1 / transformedVector[3]);
            return glMatrix.vec3.subtract([], [scaledVector[0], scaledVector[1], scaledVector[2]], eye);
        };
        return PathTracer;
    }());
    LH.PathTracer = PathTracer;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Renderer = /** @class */ (function () {
        function Renderer() {
            this._canvas = LH.GLUtilities.initialize("pathTracer");
            this._pathTracer = new LH.PathTracer();
            this._angleX = 0;
            this._angleY = 0;
            this._zoomZ = 2.5;
            this._eye = glMatrix.vec3.create();
        }
        Renderer.prototype.start = function () {
            LH.gl.clearColor(0, 0, 0, 1);
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT | LH.gl.DEPTH_BUFFER_BIT);
            // create scene
            var spheres = this.createSphereColumn();
            this._pathTracer.setObjects(spheres, new LH.Light());
            var startTime = Date.now();
            this.tick((Date.now() - startTime) * 0.001);
        };
        Renderer.prototype.tick = function (timeSinceStart) {
            this._eye[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
            this._eye[1] = this._zoomZ * Math.sin(this._angleX);
            this._eye[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);
            var view = glMatrix.mat4.lookAt([], this._eye, [0, 0, 0], [0, 1, 0]);
            var projection = glMatrix.mat4.perspective([], Math.PI / 3, 1, 0.1, 1000);
            var viewProjection = glMatrix.mat4.multiply([], projection, view);
            viewProjection = glMatrix.mat4.invert([], viewProjection);
            this._pathTracer.update(viewProjection, timeSinceStart, this._eye);
            this._pathTracer.render();
            requestAnimationFrame(this.tick.bind(this));
        };
        Renderer.prototype.createSphereColumn = function () {
            var objects = [];
            objects.push(new LH.Sphere(glMatrix.vec3.fromValues(0, -0.75, 0), 0.33));
            objects.push(new LH.Sphere(glMatrix.vec3.fromValues(0, -0.10, 0), 0.30));
            objects.push(new LH.Sphere(glMatrix.vec3.fromValues(0, 0.45, 0), 0.25));
            return objects;
        };
        return Renderer;
    }());
    LH.Renderer = Renderer;
})(LH || (LH = {}));
// vertex shader for drawing a textured quad
var renderVertexSource = "\n    attribute vec3 vertex;\n    varying vec2 texCoord;\n\n    void main() {\n        texCoord = vertex.xy * 0.5 + 0.5;\n        gl_Position = vec4(vertex, 1.0);\n    }\n";
// fragment shader for drawing a textured quad
var renderFragmentSource = "\n    precision highp float;\n\n    varying vec2 texCoord;\n    uniform sampler2D texture;\n\n    void main() {\n        gl_FragColor = texture2D(texture, texCoord);\n    }\n";
// vertex shader, interpolate ray per-pixel
var tracerVertexSource = "\n    attribute vec3 vertex;\n    uniform vec3 eye, ray00, ray01, ray10, ray11;\n    varying vec3 initialRay;\n\n    void main() {\n        vec2 percent = vertex.xy * 0.5 + 0.5;\n        initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);\n        gl_Position = vec4(vertex, 1.0);\n    }\n";
var tracerFragmentSource = "\n    precision highp float;\n\n    #define MAX_SPHERES 128\n    #define BOUNCES 5\n    #define EPSILON 0.0001\n    #define INFINITY 10000.0\n    #define LIGHT_SIZE 100.50\n    #define LIGHT_VALUE 3.5\n\n    struct Sphere\n    {\n        vec3 center;\n        float radius;\n    };\n\n    uniform vec3 eye;\n    uniform float textureWeight;\n    uniform float timeSinceStart;\n    uniform sampler2D texture;\n\n    uniform vec3 light;\n    uniform int totalSpheres;\n    uniform Sphere spheres[MAX_SPHERES];\n\n    varying vec3 initialRay;\n\n    float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {\n        vec3 toSphere = origin - sphereCenter;\n        float a = dot(ray, ray);\n        float b = 2.0 * dot(toSphere, ray);\n        float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;\n        float discriminant = b * b - 4.0 * a * c;\n\n        if (discriminant > 0.0) {\n            float t = (-b - sqrt(discriminant)) / (2.0 * a);\n            if (t > 0.0) return t;\n        }\n\n        return INFINITY;\n    }\n\n    vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) {\n        return (hit - sphereCenter) / sphereRadius;\n    }\n\n    float random(vec3 scale, float seed) {\n        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n    }\n\n    vec3 cosineWeightedDirection(float seed, vec3 normal) {\n        float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n        float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n        float r = sqrt(u);\n        float angle = 6.283185307179586 * v;\n\n        // compute basis from normal\n        vec3 sdir, tdir;\n        if (abs(normal.x) < 0.5) {\n            sdir = cross(normal, vec3(1, 0, 0));\n        } else {\n            sdir = cross(normal, vec3(0, 1, 0));\n        }\n        tdir = cross(normal, sdir);\n\n        return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1.0 - u) * normal;\n    }\n\n    vec3 uniformlyRandomDirection(float seed) {\n        float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n        float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n        float z = 1.0 - 2.0 * u;\n        float r = sqrt(1.0 - z * z);\n        float angle = 6.283185307179586 * v;\n\n        return vec3(r * cos(angle), r * sin(angle), z);\n    }\n\n    vec3 uniformlyRandomVector(float seed) {\n        return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));\n    }\n\n    float shadow(vec3 origin, vec3 ray) {\n\n        for (int i = 0; i < MAX_SPHERES; i++) {\n            if (i >= totalSpheres) break;\n            float tSpehere = intersectSphere(origin, ray, spheres[i].center, spheres[i].radius);\n            if (tSpehere < 1.0) return 0.0;\n        }\n        \n        return 1.0;\n    }\n\n    vec3 calculateColor(vec3 origin, vec3 ray, vec3 light) {\n        vec3 colorMask = vec3(1.0);\n        vec3 accumulatedColor = vec3(0.0);\n        for (int bounce = 0; bounce < BOUNCES; bounce++) {\n            float t = INFINITY;\n            vec3 normal;\n            vec3 hit = origin + ray * t;\n\n            for (int i = 0; i < MAX_SPHERES; i++) {\n                if (i >= totalSpheres) break;\n                \n                float tSpehere = intersectSphere(origin, ray, spheres[i].center, spheres[i].radius);\n                if (tSpehere < t) {\n                    t = tSpehere;\n                    hit = origin + ray * t;\n                    normal = normalForSphere(hit, spheres[i].center, spheres[i].radius);\n                }\n            }\n            \n            if (t == INFINITY) {\n                break;\n            } else {\n                ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);\n            }\n            \n            vec3 surfaceColor = vec3(0.75);\n            float specularHighlight = 0.0;\n\n            vec3 toLight = light - hit;\n            float diffuse = max(0.0, dot(normalize(toLight), normal));\n            float shadowIntensity = shadow(hit + normal * EPSILON, toLight);\n            colorMask *= surfaceColor;\n            \n            accumulatedColor += colorMask * (LIGHT_VALUE * diffuse * shadowIntensity);\n            accumulatedColor += colorMask * specularHighlight * shadowIntensity;\n            \n            origin = hit;\n        }\n        \n        return accumulatedColor;\n    }\n\n    void main() {\n        vec3 newLight = light + uniformlyRandomVector(timeSinceStart - 53.0) * LIGHT_SIZE;\n        vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;\n        gl_FragColor = vec4(mix(calculateColor(eye, initialRay, newLight), texture, textureWeight), 1.0);\n    }\n";
var renderer;
window.onload = function () {
    renderer = new LH.Renderer();
    renderer.start();
};
var LH;
(function (LH) {
    var Light = /** @class */ (function () {
        function Light() {
            this._position = glMatrix.vec3.create(0.4, 0.5, -0.6);
        }
        return Light;
    }());
    LH.Light = Light;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Sphere = /** @class */ (function () {
        function Sphere(center, radius) {
            this._center = center;
            this._radius = radius;
        }
        return Sphere;
    }());
    LH.Sphere = Sphere;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var AttributeInformation = /** @class */ (function () {
        function AttributeInformation() {
        }
        return AttributeInformation;
    }());
    LH.AttributeInformation = AttributeInformation;
    var GLBuffer = /** @class */ (function () {
        /**
         * Creates a new GL buffer.
         * @param dataType The data type of this buffer. Default: gl.FLOAT
         * @param bufferType The buffer target type. Can be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER. Default: gl.ARRAY_BUFFER
         * @param mode The drawing mode of this buffer. (i.e. gl.TRIANGLES or gl.LINES). Default: gl.TRIANGLES
         */
        function GLBuffer(elementSize, dataType, bufferType, mode) {
            if (dataType === void 0) { dataType = LH.gl.FLOAT; }
            if (bufferType === void 0) { bufferType = LH.gl.ARRAY_BUFFER; }
            if (mode === void 0) { mode = LH.gl.TRIANGLES; }
            this._hasAttributeLocation = false;
            this._data = [];
            this._attributes = [];
            this._elementSize = elementSize;
            this._dataType = dataType;
            this._bufferType = bufferType;
            this._mode = mode;
            switch (this._dataType) {
                case LH.gl.FLOAT:
                case LH.gl.INT:
                case LH.gl.UNSIGNED_INT:
                    this._dataTypeSize = 4;
                    break;
                case LH.gl.SHORT:
                case LH.gl.UNSIGNED_SHORT:
                    this._dataTypeSize = 2;
                    break;
                case LH.gl.BYTE:
                case LH.gl.UNSIGNED_BYTE:
                    this._dataTypeSize = 1;
                    break;
                default:
                    throw new Error("Unrecognized data type '" + dataType.toString() + "'");
            }
            this._stride = this._elementSize * this._dataTypeSize;
            this._buffer = LH.gl.createBuffer();
        }
        GLBuffer.prototype.destroy = function () {
            LH.gl.deleteBuffer(this._buffer);
        };
        GLBuffer.prototype.bind = function (isNormalized) {
            if (isNormalized === void 0) { isNormalized = false; }
            LH.gl.bindBuffer(this._bufferType, this._buffer);
            if (this._hasAttributeLocation) {
                for (var _i = 0, _a = this._attributes; _i < _a.length; _i++) {
                    var attribute = _a[_i];
                    LH.gl.vertexAttribPointer(attribute.location, attribute.size, this._dataType, isNormalized, this._stride, attribute.offset * this._dataTypeSize);
                    LH.gl.enableVertexAttribArray(attribute.location);
                }
            }
        };
        GLBuffer.prototype.unbind = function () {
            LH.gl.bindBuffer(this._bufferType, undefined);
            for (var _i = 0, _a = this._attributes; _i < _a.length; _i++) {
                var attribute = _a[_i];
                LH.gl.disableVertexAttribArray(attribute.location);
            }
        };
        GLBuffer.prototype.addAttributeLocation = function (attributeInformation) {
            this._hasAttributeLocation = true;
            this._attributes.push(attributeInformation);
        };
        GLBuffer.prototype.pushBackData = function (data) {
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var element = data_1[_i];
                this._data.push(element);
            }
        };
        /**
         * Upload buffer data to the GPU
         */
        GLBuffer.prototype.upload = function () {
            LH.gl.bindBuffer(this._bufferType, this._buffer);
            var bufferData;
            switch (this._dataType) {
                case LH.gl.FLOAT:
                    bufferData = new Float32Array(this._data);
                    break;
                case LH.gl.INT:
                    bufferData = new Int32Array(this._data);
                    break;
                case LH.gl.UNSIGNED_INT:
                    bufferData = new Uint32Array(this._data);
                    break;
                case LH.gl.SHORT:
                    bufferData = new Int16Array(this._data);
                    break;
                case LH.gl.UNSIGNED_SHORT:
                    bufferData = new Uint16Array(this._data);
                    break;
                case LH.gl.BYTE:
                    bufferData = new Int8Array(this._data);
                    break;
                case LH.gl.UNSIGNED_BYTE:
                    bufferData = new Uint8Array(this._data);
                    break;
            }
            LH.gl.bufferData(this._bufferType, bufferData, LH.gl.STATIC_DRAW);
        };
        GLBuffer.prototype.draw = function () {
            this.bind();
            if (this._bufferType == LH.gl.ARRAY_BUFFER) {
                LH.gl.drawArrays(this._mode, 0, this._data.length / this._elementSize);
            }
            else if (this._bufferType == LH.gl.ELEMENT_ARRAY_BUFFER) {
                LH.gl.drawElements(this._mode, this._data.length, this._dataType, 0);
            }
        };
        return GLBuffer;
    }());
    LH.GLBuffer = GLBuffer;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var GLUtilities = /** @class */ (function () {
        function GLUtilities() {
        }
        GLUtilities.initialize = function (canvasId) {
            var canvas = document.getElementById(canvasId);
            if (canvas === undefined) {
                throw new Error("Cannot find canvas element by id: " + canvasId);
            }
            LH.gl = canvas.getContext("webgl");
            if (LH.gl === undefined) {
                throw new Error("Unable to initialize WebGL!");
            }
            return canvas;
        };
        return GLUtilities;
    }());
    LH.GLUtilities = GLUtilities;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Shader = /** @class */ (function () {
        function Shader(name, vertexSource, fragmentSource) {
            this._attributes = {};
            this._uniforms = {};
            this._name = name;
            var vertexShader = this.loadShader(vertexSource, LH.gl.VERTEX_SHADER);
            var fragmentShader = this.loadShader(fragmentSource, LH.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
            this.detectAttributes();
            this.detectUniforms();
        }
        Object.defineProperty(Shader.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Shader.prototype.getAttributeLocation = function (name) {
            if (this._attributes[name] === undefined) {
                console.log('boom');
                throw new Error("Unable to find attribute '" + name + "' in shader '" + this._name + "'");
            }
            return this._attributes[name];
        };
        Shader.prototype.getUniformLocation = function (name) {
            if (this._uniforms[name] === undefined) {
                throw new Error("Unable to find uniform '" + name + "' in shader '" + this._name + "'");
            }
            return this._uniforms[name];
        };
        // TODO: this is very badly harcoded way to set uniforms
        Shader.prototype.setUniforms = function (uniforms) {
            for (var name_1 in uniforms) {
                // specific case for spheres
                if (name_1.toString() === "spheres") {
                    for (var i = 0; i < uniforms.spheres.length; i++) {
                        var centerLocation = LH.gl.getUniformLocation(this._program, "spheres[" + i + "].center");
                        LH.gl.uniform3fv(centerLocation, new Float32Array([uniforms.spheres[i]._center[0], uniforms.spheres[i]._center[1], uniforms.spheres[i]._center[2]]));
                        var radiusLocation = LH.gl.getUniformLocation(this._program, "spheres[" + i + "].radius");
                        LH.gl.uniform1f(radiusLocation, uniforms.spheres[i]._radius);
                    }
                }
                var location_1 = LH.gl.getUniformLocation(this._program, name_1);
                if (location_1 == null)
                    continue;
                var vector3Uniforms = [
                    "eye",
                    "ray00",
                    "ray01",
                    "ray11",
                    "ray10",
                    "light"
                ];
                var matrix4Uniforms = [];
                var intUniforms = [
                    "totalSpheres"
                ];
                var floatUniforms = [
                    "timeSinceStart",
                    "textureWeight"
                ];
                var value = uniforms[name_1];
                if (vector3Uniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform3fv(location_1, new Float32Array([value[0], value[1], value[2]]));
                }
                else if (matrix4Uniforms.indexOf(name_1) > -1) {
                    LH.gl.uniformMatrix4fv(location_1, false, new Float32Array(value.flatten()));
                }
                else if (intUniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform1i(location_1, value);
                }
                else if (floatUniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform1f(location_1, value);
                }
            }
        };
        Shader.prototype.use = function () {
            LH.gl.useProgram(this._program);
        };
        Shader.prototype.delete = function () {
            LH.gl.deleteProgram(this._program);
        };
        Shader.prototype.loadShader = function (source, shaderType) {
            var shader = LH.gl.createShader(shaderType);
            LH.gl.shaderSource(shader, source);
            LH.gl.compileShader(shader);
            var shaderInfoLog = LH.gl.getShaderInfoLog(shader);
            if (shaderInfoLog !== "") {
                throw new Error("Error compiling shader '" + this._name + "': '" + shaderInfoLog + "'");
            }
            return shader;
        };
        Shader.prototype.createProgram = function (vertexShader, fragmentShader) {
            this._program = LH.gl.createProgram();
            LH.gl.attachShader(this._program, vertexShader);
            LH.gl.attachShader(this._program, fragmentShader);
            LH.gl.linkProgram(this._program);
            var programInfoLog = LH.gl.getProgramInfoLog(this._program);
            if (programInfoLog !== "") {
                throw new Error("Error linking shader '" + this._name + "': " + programInfoLog + "'");
            }
        };
        Shader.prototype.detectAttributes = function () {
            var attributeCount = LH.gl.getProgramParameter(this._program, LH.gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < attributeCount; i++) {
                var attribute = LH.gl.getActiveAttrib(this._program, i);
                if (!attribute) {
                    break;
                }
                this._attributes[attribute.name] = LH.gl.getAttribLocation(this._program, attribute.name);
            }
        };
        Shader.prototype.detectUniforms = function () {
            var uniformCount = LH.gl.getProgramParameter(this._program, LH.gl.ACTIVE_UNIFORMS);
            for (var i = 0; i < uniformCount; i++) {
                var uniform = LH.gl.getActiveUniform(this._program, i);
                if (!uniform) {
                    break;
                }
                this._uniforms[uniform.name] = LH.gl.getUniformLocation(this._program, uniform.name);
            }
        };
        return Shader;
    }());
    LH.Shader = Shader;
})(LH || (LH = {}));
