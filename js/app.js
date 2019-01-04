var LH;
(function (LH) {
    var Engine = /** @class */ (function () {
        function Engine() {
            this._frameCount = 0;
            console.log("Engine created.");
        }
        Engine.prototype.start = function () {
            this._canvas = LH.GLUtilities.initialize("pathTracer");
            LH.gl.clearColor(0, 0, 0, 1);
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT | LH.gl.DEPTH_BUFFER_BIT);
            // load shaders
            this.loadLineShader();
            this._lineShader.use();
            this.loadRendererShader();
            this._rendererShader.use();
            this.loadTracerShader();
            this._tracerShader.use();
            // init geometry
            //this._projection = Matrix4x4.orthographic(0, this._canvas.width, 0, this._canvas.height, -100.0, 100.0);
            //this._sprite = new Sprite("quad");
            //this._sprite.load();
            //this.resizeWindow();
            this.tick();
        };
        Engine.prototype.tick = function () {
            this._frameCount++;
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT);
            // set uniforms
            /*let colorPosition = this._shader.getUniformLocation("u_color");
            gl.uniform4f(colorPosition, 1, 0.5, 0, 1);

            let projectionPosition = this._shader.getUniformLocation("u_projection");
            gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this._projection.data));

            let modelLocation = this._shader.getUniformLocation("u_model");
            gl.uniformMatrix4fv(modelLocation, false, new Float32Array(Matrix4x4.translation(this._sprite.position).data));*/
            // render & animate
            //this._sprite.position.x++;
            //this._sprite.position.y++;
            /*if (this._sprite.position.x > 200) {
                this._sprite.position.x = 0;
            }
            if (this._sprite.position.y > 50) {
                this._sprite.position.y = 0;
            }

            this._sprite.draw();*/
            // run game loop
            requestAnimationFrame(this.tick.bind(this));
        };
        Engine.prototype.resizeWindow = function () {
            if (this._canvas !== undefined) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
                //gl.viewport(-1, 1, 1, -1);
            }
        };
        Engine.prototype.loadRendererShader = function () {
            var vertexShaderSource = "\n                attribute vec3 vertex;\n                varying vec2 texCoord;\n                \n                void main() {\n                    texCoord = vertex.xy * 0.5 + 0.5;\n                    gl_Position = vec4(vertex, 1.0);\n                }\n            ";
            var fragmentShaderSource = "\n                precision highp float;\n                varying vec2 texCoord;\n                uniform sampler2D texture;\n                \n                void main() {\n                    gl_FragColor = texture2D(texture, texCoord);\n                }\n            ";
            this._rendererShader = new LH.Shader("renderer", vertexShaderSource, fragmentShaderSource);
        };
        Engine.prototype.loadTracerShader = function () {
            var vertexShaderSource = "\n                attribute vec3 vertex;\n                uniform vec3 eye, ray00, ray01, ray10, ray11;\n                varying vec3 initialRay;\n                \n                void main() {\n                    vec2 percent = vertex.xy * 0.5 + 0.5;\n                    initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);\n                    gl_Position = vec4(vertex, 1.0);\n                }\n            ";
            var fragmentShaderSource = "\n                precision highp float;\n                uniform vec3 eye;\n                varying vec3 initialRay;\n\n                uniform float textureWeight;\n                uniform float timeSinceStart;\n                uniform sampler2D texture;\n                uniform float glossiness;\n\n                vec3 roomCubeMin = vec3(-1.0, -1.0, -1.0);\n                vec3 roomCubeMax = vec3(1.0, 1.0, 1.0);\n\n                uniform vec3 light;\n\n                uniform vec3 sphereCenter0;\n                uniform float sphereRadius0;\n                uniform vec3 sphereCenter1;\n                uniform float sphereRadius1;\n                uniform vec3 sphereCenter2;\n                uniform float sphereRadius2;\n                uniform vec3 sphereCenter3;\n                uniform float sphereRadius3;\n\n                vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {\n                    vec3 tMin = (cubeMin - origin) / ray;\n                    vec3 tMax = (cubeMax - origin) / ray;\n                    vec3 t1 = min(tMin, tMax);\n                    vec3 t2 = max(tMin, tMax);\n                    float tNear = max(max(t1.x, t1.y), t1.z);\n                    float tFar = min(min(t2.x, t2.y), t2.z);\n                    \n                    return vec2(tNear, tFar);\n                }\n                \n                vec3 normalForCube(vec3 hit, vec3 cubeMin, vec3 cubeMax) {\n                    if (hit.x < cubeMin.x + 0.0001) return vec3(-1.0, 0.0, 0.0);\n                    else if(hit.x > cubeMax.x - 0.0001) return vec3(1.0, 0.0, 0.0);\n                    else if(hit.y < cubeMin.y + 0.0001) return vec3(0.0, -1.0, 0.0);\n                    else if(hit.y > cubeMax.y - 0.0001) return vec3(0.0, 1.0, 0.0);\n                    else if(hit.z < cubeMin.z + 0.0001) return vec3(0.0, 0.0, -1.0);\n                    else return vec3(0.0, 0.0, 1.0);\n                }\n                \n                float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {\n                    vec3 toSphere = origin - sphereCenter;\n                    float a = dot(ray, ray);\n                    float b = 2.0 * dot(toSphere, ray);\n                    float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;\n                    float discriminant = b*b - 4.0*a*c;\n                    \n                    if(discriminant > 0.0) {\n                        float t = (-b - sqrt(discriminant)) / (2.0 * a);\n                        if(t > 0.0) return t;\n                    }\n                    \n                    return 10000.0;\n                }\n                \n                vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) {\n                    return (hit - sphereCenter) / sphereRadius;\n                }\n                \n                float random(vec3 scale, float seed) {\n                    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n                }\n                \n                vec3 cosineWeightedDirection(float seed, vec3 normal) {\n                    float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n                    float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n                    float r = sqrt(u);\n                    float angle = 6.283185307179586 * v;\n                    vec3 sdir, tdir;\n                    \n                    if (abs(normal.x)<.5) {\n                        sdir = cross(normal, vec3(1,0,0));\n                    } else {\n                        sdir = cross(normal, vec3(0,1,0));\n                    }\n                    \n                    tdir = cross(normal, sdir);\n                    \n                    return r*cos(angle)*sdir + r*sin(angle)*tdir + sqrt(1.-u)*normal;\n                }\n                \n                vec3 uniformlyRandomDirection(float seed) {\n                    float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n                    float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n                    float z = 1.0 - 2.0 * u;\n                    float r = sqrt(1.0 - z * z);\n                    float angle = 6.283185307179586 * v;\n                    return vec3(r * cos(angle), r * sin(angle), z);\n                }\n                \n                vec3 uniformlyRandomVector(float seed) {\n                    return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));\n                }\n                \n                float shadow(vec3 origin, vec3 ray) {\n                    float tSphere0 = intersectSphere(origin, ray, sphereCenter0, sphereRadius0);\n                    if(tSphere0 < 1.0) return 0.0;\n\n                    float tSphere1 = intersectSphere(origin, ray, sphereCenter1, sphereRadius1);\n                    if(tSphere1 < 1.0) return 0.0;\n\n                    float tSphere2 = intersectSphere(origin, ray, sphereCenter2, sphereRadius2);\n                    if(tSphere2 < 1.0) return 0.0;\n\n                    float tSphere3 = intersectSphere(origin, ray, sphereCenter3, sphereRadius3);\n                    if(tSphere3 < 1.0) return 0.0;\n                    \n                    return 1.0;\n                }\n                \n                vec3 calculateColor(vec3 origin, vec3 ray, vec3 light) {\n                    vec3 colorMask = vec3(1.0);\n                    vec3 accumulatedColor = vec3(0.0);\n                    for(int bounce = 0; bounce < 5; bounce++) {\n                        vec2 tRoom = intersectCube(origin, ray, roomCubeMin, roomCubeMax);\n\n                        float tSphere0 = intersectSphere(origin, ray, sphereCenter0, sphereRadius0);\n                        float tSphere1 = intersectSphere(origin, ray, sphereCenter1, sphereRadius1);\n                        float tSphere2 = intersectSphere(origin, ray, sphereCenter2, sphereRadius2);\n                        float tSphere3 = intersectSphere(origin, ray, sphereCenter3, sphereRadius3);\n\n                        float t = 10000.0;\n                        if(tRoom.x < tRoom.y) t = tRoom.y;\n                        \n                        if(tSphere0 < t) t = tSphere0;\n                        if(tSphere1 < t) t = tSphere1;\n                        if(tSphere2 < t) t = tSphere2;\n                        if(tSphere3 < t) t = tSphere3;\n                        \n                        vec3 hit = origin + ray * t;\n                        vec3 surfaceColor = vec3(0.75);\n                        float specularHighlight = 0.0;\n                        vec3 normal;\n                        \n                        if(t == tRoom.y) {\n                            normal = -normalForCube(hit, roomCubeMin, roomCubeMax);\n                            if(hit.x < -0.9999) surfaceColor = vec3(0.1, 0.5, 1.0);\n                            else if(hit.x > 0.9999) surfaceColor = vec3(1.0, 0.9, 0.1);\n                            \n                            ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);\n                        } else if(t == 10000.0) {\n                            break;\n                        } else {\n                            if(false) ; else if(t == tSphere0) normal = normalForSphere(hit, sphereCenter0, sphereRadius0);\n                            else if(t == tSphere1) normal = normalForSphere(hit, sphereCenter1, sphereRadius1);\n                            else if(t == tSphere2) normal = normalForSphere(hit, sphereCenter2, sphereRadius2);\n                            else if(t == tSphere3) normal = normalForSphere(hit, sphereCenter3, sphereRadius3);\n                            ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);\n                        }\n                        \n                        vec3 toLight = light - hit;\n                        float diffuse = max(0.0, dot(normalize(toLight), normal));\n                        float shadowIntensity = shadow(hit + normal * 0.0001, toLight);\n                        colorMask *= surfaceColor;\n                        \n                        accumulatedColor += colorMask * (0.5 * diffuse * shadowIntensity);\n                        accumulatedColor += colorMask * specularHighlight * shadowIntensity;\n                        \n                        origin = hit;\n                    }\n                    \n                    return accumulatedColor;\n                }\n                \n                void main() {\n                    vec3 newLight = light + uniformlyRandomVector(timeSinceStart - 53.0) * 0.1;\n                    vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;\n                    gl_FragColor = vec4(mix(calculateColor(eye, initialRay, newLight), texture, textureWeight), 1.0);\n                }\n            ";
            this._tracerShader = new LH.Shader("tracer", vertexShaderSource, fragmentShaderSource);
        };
        Engine.prototype.loadLineShader = function () {
            var vertexShaderSource = "\n                attribute vec3 vertex;\n                uniform vec3 cubeMin;\n                uniform vec3 cubeMax;\n                uniform mat4 modelviewProjection;\n                \n                void main() {\n                    gl_Position = modelviewProjection * vec4(mix(cubeMin, cubeMax, vertex), 1.0);\n                }\n            ";
            var fragmentShaderSource = "\n                precision highp float;\n                \n                void main() {\n                    gl_FragColor = vec4(1.0);\n                }\n            ";
            this._lineShader = new LH.Shader("line", vertexShaderSource, fragmentShaderSource);
        };
        return Engine;
    }());
    LH.Engine = Engine;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var PathTracer = /** @class */ (function () {
        function PathTracer() {
            var vertices = [
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ];
            // create vertex buffer
            this.vertexBuffer = LH.gl.createBuffer();
            LH.gl.bindBuffer(LH.gl.ARRAY_BUFFER, this.vertexBuffer);
            LH.gl.bufferData(LH.gl.ARRAY_BUFFER, new Float32Array(vertices), LH.gl.STATIC_DRAW);
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
            this.renderVertexAttribute = this.renderShader.getAttributeLocation('vertex');
            LH.gl.enableVertexAttribArray(this.renderVertexAttribute);
            // objects and shader will be filled in when setObjects() is called
            this.objects = [];
            this.sampleCount = 0;
            this.tracerShader = null;
        }
        PathTracer.prototype.setObjects = function (objects) {
            this.uniforms = {};
            this.sampleCount = 0;
            this.objects = objects;
            // create tracer shader
            if (this.tracerShader != null) {
                this.tracerShader.delete();
            }
            this.tracerShader = new LH.Shader('tracer', tracerVertexSource, makeTracerFragmentSource(objects));
            this.tracerVertexAttribute = this.tracerShader.getAttributeLocation('vertex');
            LH.gl.enableVertexAttribArray(this.tracerVertexAttribute);
        };
        PathTracer.prototype.update = function (matrix, timeSinceStart) {
            // calculate uniforms
            for (var i = 0; i < this.objects.length; i++) {
                this.objects[i].setUniforms(this);
            }
            this.uniforms.eye = eye;
            this.uniforms.glossiness = glossiness;
            this.uniforms.ray00 = getEyeRay(matrix, -1, -1);
            this.uniforms.ray01 = getEyeRay(matrix, -1, +1);
            this.uniforms.ray10 = getEyeRay(matrix, +1, -1);
            this.uniforms.ray11 = getEyeRay(matrix, +1, +1);
            this.uniforms.timeSinceStart = timeSinceStart;
            this.uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);
            // set uniforms
            this.tracerShader.use();
            this.tracerShader.setUniforms(this.uniforms);
            // render to texture
            this.tracerShader.use();
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this.textures[0]);
            LH.gl.bindBuffer(LH.gl.ARRAY_BUFFER, this.vertexBuffer);
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, this.framebuffer);
            LH.gl.framebufferTexture2D(LH.gl.FRAMEBUFFER, LH.gl.COLOR_ATTACHMENT0, LH.gl.TEXTURE_2D, this.textures[1], 0);
            LH.gl.vertexAttribPointer(this.tracerVertexAttribute, 2, LH.gl.FLOAT, false, 0, 0);
            LH.gl.drawArrays(LH.gl.TRIANGLE_STRIP, 0, 4);
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, null);
            // ping pong textures
            this.textures.reverse();
            this.sampleCount++;
        };
        PathTracer.prototype.render = function () {
            this.renderShader.use();
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this.textures[0]);
            LH.gl.bindBuffer(LH.gl.ARRAY_BUFFER, this.vertexBuffer);
            LH.gl.vertexAttribPointer(this.renderVertexAttribute, 2, LH.gl.FLOAT, false, 0, 0);
            LH.gl.drawArrays(LH.gl.TRIANGLE_STRIP, 0, 4);
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
        }
        Renderer.prototype.start = function () {
            LH.gl.clearColor(0, 0, 0, 1);
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT | LH.gl.DEPTH_BUFFER_BIT);
            // create scene
            var objects = this.makeSphereColumn();
            objects.splice(0, 0, new LH.Light());
            this._pathTracer.setObjects(objects);
            var start = new Date();
            // TODO: use setInterval to avoid stripes on the output image
            //setInterval(function() { this.tick((new Date() - start) * 0.001); }, 1000 / 60);
            this.tick((new Date() - start));
        };
        Renderer.prototype.update = function (modelviewProjection, timeSinceStart) {
            var jitter = Matrix.Translation(Vector.create([Math.random() * 2 - 1, Math.random() * 2 - 1, 0]).multiply(1 / 512));
            var inverse = jitter.multiply(modelviewProjection).inverse();
            this._pathTracer.update(inverse, timeSinceStart);
        };
        Renderer.prototype.tick = function (timeSinceStart) {
            eye.elements[0] = zoomZ * Math.sin(angleY) * Math.cos(angleX);
            eye.elements[1] = zoomZ * Math.sin(angleX);
            eye.elements[2] = zoomZ * Math.cos(angleY) * Math.cos(angleX);
            this.modelview = makeLookAt(eye.elements[0], eye.elements[1], eye.elements[2], 0, 0, 0, 0, 1, 0);
            this.projection = makePerspective(55, 1, 0.1, 100);
            this.modelviewProjection = this.projection.multiply(this.modelview);
            this.update(this.modelviewProjection, timeSinceStart);
            this._pathTracer.render();
            requestAnimationFrame(this.tick.bind(this));
        };
        Renderer.prototype.makeSphereColumn = function () {
            var objects = [];
            objects.push(new LH.Sphere(Vector.create([0, -0.25, 0]), 0.25, nextObjectId++));
            objects.push(new LH.Sphere(Vector.create([0, -0.75, 0]), 0.25, nextObjectId++));
            return objects;
        };
        return Renderer;
    }());
    LH.Renderer = Renderer;
})(LH || (LH = {}));
// entry point
/*let engine: LH.Engine;

window.onload = function() {
    engine = new LH.Engine();
    engine.start();
}

window.onresize = function() {
    engine.resizeWindow();
}*/
////////////////////////////////////////////////////////////////////////////////
// shader strings
////////////////////////////////////////////////////////////////////////////////
// vertex shader for drawing a textured quad
var renderVertexSource = ' attribute vec3 vertex;' +
    ' varying vec2 texCoord;' +
    ' void main() {' +
    '   texCoord = vertex.xy * 0.5 + 0.5;' +
    '   gl_Position = vec4(vertex, 1.0);' +
    ' }';
// fragment shader for drawing a textured quad
var renderFragmentSource = ' precision highp float;' +
    ' varying vec2 texCoord;' +
    ' uniform sampler2D texture;' +
    ' void main() {' +
    '   gl_FragColor = texture2D(texture, texCoord);' +
    ' }';
// constants for the shaders
var bounces = '5';
var epsilon = '0.0001';
var infinity = '10000.0';
var lightSize = 0.1;
var lightVal = 0.5;
// vertex shader, interpolate ray per-pixel
var tracerVertexSource = ' attribute vec3 vertex;' +
    ' uniform vec3 eye, ray00, ray01, ray10, ray11;' +
    ' varying vec3 initialRay;' +
    ' void main() {' +
    '   vec2 percent = vertex.xy * 0.5 + 0.5;' +
    '   initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);' +
    '   gl_Position = vec4(vertex, 1.0);' +
    ' }';
// start of fragment shader
var tracerFragmentSourceHeader = ' precision highp float;' +
    ' uniform vec3 eye;' +
    ' varying vec3 initialRay;' +
    ' uniform float textureWeight;' +
    ' uniform float timeSinceStart;' +
    ' uniform sampler2D texture;' +
    ' uniform float glossiness;' +
    ' vec3 roomCubeMin = vec3(-1.0, -1.0, -1.0);' +
    ' vec3 roomCubeMax = vec3(1.0, 1.0, 1.0);';
// compute the near and far intersections of the cube (stored in the x and y components) using the slab method
// no intersection means vec.x > vec.y (really tNear > tFar)
var intersectCubeSource = ' vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {' +
    '   vec3 tMin = (cubeMin - origin) / ray;' +
    '   vec3 tMax = (cubeMax - origin) / ray;' +
    '   vec3 t1 = min(tMin, tMax);' +
    '   vec3 t2 = max(tMin, tMax);' +
    '   float tNear = max(max(t1.x, t1.y), t1.z);' +
    '   float tFar = min(min(t2.x, t2.y), t2.z);' +
    '   return vec2(tNear, tFar);' +
    ' }';
// given that hit is a point on the cube, what is the surface normal?
// TODO: do this with fewer branches
var normalForCubeSource = ' vec3 normalForCube(vec3 hit, vec3 cubeMin, vec3 cubeMax)' +
    ' {' +
    '   if(hit.x < cubeMin.x + ' + epsilon + ') return vec3(-1.0, 0.0, 0.0);' +
    '   else if(hit.x > cubeMax.x - ' + epsilon + ') return vec3(1.0, 0.0, 0.0);' +
    '   else if(hit.y < cubeMin.y + ' + epsilon + ') return vec3(0.0, -1.0, 0.0);' +
    '   else if(hit.y > cubeMax.y - ' + epsilon + ') return vec3(0.0, 1.0, 0.0);' +
    '   else if(hit.z < cubeMin.z + ' + epsilon + ') return vec3(0.0, 0.0, -1.0);' +
    '   else return vec3(0.0, 0.0, 1.0);' +
    ' }';
// compute the near intersection of a sphere
// no intersection returns a value of +infinity
var intersectSphereSource = ' float intersectSphere(vec3 origin, vec3 ray, vec3 sphereCenter, float sphereRadius) {' +
    '   vec3 toSphere = origin - sphereCenter;' +
    '   float a = dot(ray, ray);' +
    '   float b = 2.0 * dot(toSphere, ray);' +
    '   float c = dot(toSphere, toSphere) - sphereRadius*sphereRadius;' +
    '   float discriminant = b*b - 4.0*a*c;' +
    '   if(discriminant > 0.0) {' +
    '     float t = (-b - sqrt(discriminant)) / (2.0 * a);' +
    '     if(t > 0.0) return t;' +
    '   }' +
    '   return ' + infinity + ';' +
    ' }';
// given that hit is a point on the sphere, what is the surface normal?
var normalForSphereSource = ' vec3 normalForSphere(vec3 hit, vec3 sphereCenter, float sphereRadius) {' +
    '   return (hit - sphereCenter) / sphereRadius;' +
    ' }';
// use the fragment position for randomness
var randomSource = ' float random(vec3 scale, float seed) {' +
    '   return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);' +
    ' }';
// random cosine-weighted distributed vector
// from http://www.rorydriscoll.com/2009/01/07/better-sampling/
var cosineWeightedDirectionSource = ' vec3 cosineWeightedDirection(float seed, vec3 normal) {' +
    '   float u = random(vec3(12.9898, 78.233, 151.7182), seed);' +
    '   float v = random(vec3(63.7264, 10.873, 623.6736), seed);' +
    '   float r = sqrt(u);' +
    '   float angle = 6.283185307179586 * v;' +
    // compute basis from normal
    '   vec3 sdir, tdir;' +
    '   if (abs(normal.x)<.5) {' +
    '     sdir = cross(normal, vec3(1,0,0));' +
    '   } else {' +
    '     sdir = cross(normal, vec3(0,1,0));' +
    '   }' +
    '   tdir = cross(normal, sdir);' +
    '   return r*cos(angle)*sdir + r*sin(angle)*tdir + sqrt(1.-u)*normal;' +
    ' }';
// random normalized vector
var uniformlyRandomDirectionSource = ' vec3 uniformlyRandomDirection(float seed) {' +
    '   float u = random(vec3(12.9898, 78.233, 151.7182), seed);' +
    '   float v = random(vec3(63.7264, 10.873, 623.6736), seed);' +
    '   float z = 1.0 - 2.0 * u;' +
    '   float r = sqrt(1.0 - z * z);' +
    '   float angle = 6.283185307179586 * v;' +
    '   return vec3(r * cos(angle), r * sin(angle), z);' +
    ' }';
// random vector in the unit sphere
// note: this is probably not statistically uniform, saw raising to 1/3 power somewhere but that looks wrong?
var uniformlyRandomVectorSource = ' vec3 uniformlyRandomVector(float seed) {' +
    '   return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));' +
    ' }';
// compute specular lighting contribution
var specularReflection = ' vec3 reflectedLight = normalize(reflect(light - hit, normal));' +
    ' specularHighlight = max(0.0, dot(reflectedLight, normalize(hit - origin)));';
// update ray using normal and bounce according to a diffuse reflection
var newDiffuseRay = ' ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);';
// update ray using normal according to a specular reflection
var newReflectiveRay = ' ray = reflect(ray, normal);' +
    specularReflection +
    ' specularHighlight = 2.0 * pow(specularHighlight, 20.0);';
// update ray using normal and bounce according to a glossy reflection
var newGlossyRay = ' ray = normalize(reflect(ray, normal)) + uniformlyRandomVector(timeSinceStart + float(bounce)) * glossiness;' +
    specularReflection +
    ' specularHighlight = pow(specularHighlight, 3.0);';
var yellowBlueCornellBox = ' if(hit.x < -0.9999) surfaceColor = vec3(0.1, 0.5, 1.0);' + // blue
    ' else if(hit.x > 0.9999) surfaceColor = vec3(1.0, 0.9, 0.1);'; // yellow
var redGreenCornellBox = ' if(hit.x < -0.9999) surfaceColor = vec3(1.0, 0.3, 0.1);' + // red
    ' else if(hit.x > 0.9999) surfaceColor = vec3(0.3, 1.0, 0.1);'; // green
function makeShadow(objects) {
    return '' +
        ' float shadow(vec3 origin, vec3 ray) {' +
        concat(objects, function (o) { return o.getShadowTestCode(); }) +
        '   return 1.0;' +
        ' }';
}
function makeCalculateColor(objects) {
    return '' +
        ' vec3 calculateColor(vec3 origin, vec3 ray, vec3 light) {' +
        '   vec3 colorMask = vec3(1.0);' +
        '   vec3 accumulatedColor = vec3(0.0);' +
        // main raytracing loop
        '   for(int bounce = 0; bounce < ' + bounces + '; bounce++) {' +
        // compute the intersection with everything
        '     vec2 tRoom = intersectCube(origin, ray, roomCubeMin, roomCubeMax);' +
        concat(objects, function (o) { return o.getIntersectCode(); }) +
        // find the closest intersection
        '     float t = ' + infinity + ';' +
        '     if(tRoom.x < tRoom.y) t = tRoom.y;' +
        concat(objects, function (o) { return o.getMinimumIntersectCode(); }) +
        // info about hit
        '     vec3 hit = origin + ray * t;' +
        '     vec3 surfaceColor = vec3(0.75);' +
        '     float specularHighlight = 0.0;' +
        '     vec3 normal;' +
        // calculate the normal (and change wall color)
        '     if(t == tRoom.y) {' +
        '       normal = -normalForCube(hit, roomCubeMin, roomCubeMax);' +
        [yellowBlueCornellBox, redGreenCornellBox][environment] +
        newDiffuseRay +
        '     } else if(t == ' + infinity + ') {' +
        '       break;' +
        '     } else {' +
        '       if(false) ;' + // hack to discard the first 'else' in 'else if'
        concat(objects, function (o) { return o.getNormalCalculationCode(); }) +
        [newDiffuseRay, newReflectiveRay, newGlossyRay][material] +
        '     }' +
        // compute diffuse lighting contribution
        '     vec3 toLight = light - hit;' +
        '     float diffuse = max(0.0, dot(normalize(toLight), normal));' +
        // trace a shadow ray to the light
        '     float shadowIntensity = shadow(hit + normal * ' + epsilon + ', toLight);' +
        // do light bounce
        '     colorMask *= surfaceColor;' +
        '     accumulatedColor += colorMask * (' + lightVal + ' * diffuse * shadowIntensity);' +
        '     accumulatedColor += colorMask * specularHighlight * shadowIntensity;' +
        // calculate next origin
        '     origin = hit;' +
        '   }' +
        '   return accumulatedColor;' +
        ' }';
}
function makeMain() {
    return '' +
        ' void main() {' +
        '   vec3 newLight = light + uniformlyRandomVector(timeSinceStart - 53.0) * ' + lightSize + ';' +
        '   vec3 texture = texture2D(texture, gl_FragCoord.xy / 512.0).rgb;' +
        '   gl_FragColor = vec4(mix(calculateColor(eye, initialRay, newLight), texture, textureWeight), 1.0);' +
        ' }';
}
function makeTracerFragmentSource(objects) {
    return tracerFragmentSourceHeader +
        concat(objects, function (o) { return o.getGlobalCode(); }) +
        intersectCubeSource +
        normalForCubeSource +
        intersectSphereSource +
        normalForSphereSource +
        randomSource +
        cosineWeightedDirectionSource +
        uniformlyRandomDirectionSource +
        uniformlyRandomVectorSource +
        makeShadow(objects) +
        makeCalculateColor(objects) +
        makeMain();
}
////////////////////////////////////////////////////////////////////////////////
// utility functions
////////////////////////////////////////////////////////////////////////////////
function getEyeRay(matrix, x, y) {
    return matrix.multiply(Vector.create([x, y, 0, 1])).divideByW().ensure3().subtract(eye);
}
function concat(objects, func) {
    var text = '';
    for (var i = 0; i < objects.length; i++) {
        text += func(objects[i]);
    }
    return text;
}
Vector.prototype.ensure3 = function () {
    return Vector.create([this.elements[0], this.elements[1], this.elements[2]]);
};
Vector.prototype.ensure4 = function (w) {
    return Vector.create([this.elements[0], this.elements[1], this.elements[2], w]);
};
Vector.prototype.divideByW = function () {
    var w = this.elements[this.elements.length - 1];
    var newElements = [];
    for (var i = 0; i < this.elements.length; i++) {
        newElements.push(this.elements[i] / w);
    }
    return Vector.create(newElements);
};
Vector.prototype.componentDivide = function (vector) {
    if (this.elements.length != vector.elements.length) {
        return null;
    }
    var newElements = [];
    for (var i = 0; i < this.elements.length; i++) {
        newElements.push(this.elements[i] / vector.elements[i]);
    }
    return Vector.create(newElements);
};
Vector.min = function (a, b) {
    if (a.length != b.length) {
        return null;
    }
    var newElements = [];
    for (var i = 0; i < a.elements.length; i++) {
        newElements.push(Math.min(a.elements[i], b.elements[i]));
    }
    return Vector.create(newElements);
};
Vector.max = function (a, b) {
    if (a.length != b.length) {
        return null;
    }
    var newElements = [];
    for (var i = 0; i < a.elements.length; i++) {
        newElements.push(Math.max(a.elements[i], b.elements[i]));
    }
    return Vector.create(newElements);
};
Vector.prototype.minComponent = function () {
    var value = Number.MAX_VALUE;
    for (var i = 0; i < this.elements.length; i++) {
        value = Math.min(value, this.elements[i]);
    }
    return value;
};
Vector.prototype.maxComponent = function () {
    var value = -Number.MAX_VALUE;
    for (var i = 0; i < this.elements.length; i++) {
        value = Math.max(value, this.elements[i]);
    }
    return value;
};
////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////
var angleX = 0;
var angleY = 0;
var zoomZ = 2.5;
var eye = Vector.create([0, 0, 0]);
var light = Vector.create([0.4, 0.5, -0.6]);
var nextObjectId = 0;
var MATERIAL_DIFFUSE = 0;
var MATERIAL_MIRROR = 1;
var MATERIAL_GLOSSY = 2;
var material = MATERIAL_DIFFUSE;
var glossiness = 0.6;
var YELLOW_BLUE_CORNELL_BOX = 0;
var RED_GREEN_CORNELL_BOX = 1;
var environment = YELLOW_BLUE_CORNELL_BOX;
var renderer;
window.onload = function () {
    renderer = new LH.Renderer();
    renderer.start();
};
var LH;
(function (LH) {
    var Light = /** @class */ (function () {
        function Light() {
            this._temporaryTranslation = Vector.create([0, 0, 0]);
        }
        Light.prototype.getGlobalCode = function () {
            return 'uniform vec3 light;';
        };
        Light.prototype.getIntersectCode = function () {
            return '';
        };
        Light.prototype.getShadowTestCode = function () {
            return '';
        };
        Light.prototype.getMinimumIntersectCode = function () {
            return '';
        };
        Light.prototype.getNormalCalculationCode = function () {
            return '';
        };
        Light.prototype.setUniforms = function (renderer) {
            renderer.uniforms.light = light.add(this._temporaryTranslation);
        };
        Light.prototype.clampPosition = function (position) {
            for (var i = 0; i < position.elements.length; i++) {
                position.elements[i] = Math.max(lightSize - 1, Math.min(1 - lightSize, position.elements[i]));
            }
        };
        Light.prototype.temporaryTranslate = function (translation) {
            var tempLight = light.add(translation);
            this.clampPosition(tempLight);
            this._temporaryTranslation = tempLight.subtract(light);
        };
        Light.prototype.translate = function (translation) {
            light = light.add(translation);
            this.clampPosition(light);
        };
        Light.prototype.getMinCorner = function () {
            return light.add(this._temporaryTranslation).subtract(Vector.create([lightSize, lightSize, lightSize]));
        };
        Light.prototype.getMaxCorner = function () {
            return light.add(this._temporaryTranslation).add(Vector.create([lightSize, lightSize, lightSize]));
        };
        Light.prototype.intersect = function (origin, ray) {
            return Number.MAX_VALUE;
        };
        return Light;
    }());
    LH.Light = Light;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Sphere = /** @class */ (function () {
        function Sphere(center, radius, id) {
            this._center = center;
            this._radius = radius;
            this._centerStr = 'sphereCenter' + id;
            this._radiusStr = 'sphereRadius' + id;
            this._intersectStr = 'tSphere' + id;
            this._temporaryTranslation = Vector.create([0, 0, 0]);
        }
        Sphere.prototype.getGlobalCode = function () {
            return '' +
                ' uniform vec3 ' + this._centerStr + ';' +
                ' uniform float ' + this._radiusStr + ';';
        };
        Sphere.prototype.getIntersectCode = function () {
            return '' +
                ' float ' + this._intersectStr + ' = intersectSphere(origin, ray, ' + this._centerStr + ', ' + this._radiusStr + ');';
        };
        Sphere.prototype.getShadowTestCode = function () {
            return '' +
                this.getIntersectCode() +
                ' if(' + this._intersectStr + ' < 1.0) return 0.0;';
        };
        Sphere.prototype.getMinimumIntersectCode = function () {
            return '' +
                ' if(' + this._intersectStr + ' < t) t = ' + this._intersectStr + ';';
        };
        Sphere.prototype.getNormalCalculationCode = function () {
            return '' +
                ' else if(t == ' + this._intersectStr + ') normal = normalForSphere(hit, ' + this._centerStr + ', ' + this._radiusStr + ');';
        };
        Sphere.prototype.setUniforms = function (renderer) {
            renderer.uniforms[this._centerStr] = this._center.add(this._temporaryTranslation);
            renderer.uniforms[this._radiusStr] = this._radius;
        };
        Sphere.prototype.temporaryTranslate = function (translation) {
            this._temporaryTranslation = translation;
        };
        Sphere.prototype.translate = function (translation) {
            this._center = this._center.add(translation);
        };
        Sphere.prototype.getMinCorner = function () {
            return this._center.add(this._temporaryTranslation).subtract(Vector.create([this._radius, this._radius, this._radius]));
        };
        Sphere.prototype.getMaxCorner = function () {
            return this._center.add(this._temporaryTranslation).add(Vector.create([this._radius, this._radius, this._radius]));
        };
        Sphere.prototype.intersect = function (origin, ray, center, radius) {
            var toSphere = origin.subtract(center);
            var a = ray.dot(ray);
            var b = 2 * toSphere.dot(ray);
            var c = toSphere.dot(toSphere) - radius * radius;
            var discriminant = b * b - 4 * a * c;
            if (discriminant > 0) {
                var t = (-b - Math.sqrt(discriminant)) / (2 * a);
                if (t > 0) {
                    return t;
                }
            }
            return Number.MAX_VALUE;
        };
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
        Shader.prototype.setUniforms = function (uniforms) {
            for (var name_1 in uniforms) {
                var location_1 = LH.gl.getUniformLocation(this._program, name_1);
                if (location_1 == null)
                    continue;
                var value = uniforms[name_1];
                if (value instanceof Vector) {
                    LH.gl.uniform3fv(location_1, new Float32Array([value.elements[0], value.elements[1], value.elements[2]]));
                }
                else if (value instanceof Matrix) {
                    LH.gl.uniformMatrix4fv(location_1, false, new Float32Array(value.flatten()));
                }
                else {
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
var LH;
(function (LH) {
    var Sprite = /** @class */ (function () {
        function Sprite(name, width, height, position) {
            if (width === void 0) { width = 100; }
            if (height === void 0) { height = 100; }
            if (position === void 0) { position = new LH.Vector3(); }
            this._name = name;
            this._width = width;
            this._height = height;
            this._position = position;
        }
        Object.defineProperty(Sprite.prototype, "position", {
            get: function () {
                return this._position;
            },
            set: function (value) {
                this._position = value;
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.load = function () {
            this._buffer = new LH.GLBuffer(3);
            var positionAttribute = new LH.AttributeInformation();
            //positionAttribute.location = this._shader.getAttributeLocation("a_position");
            positionAttribute.location = 0;
            positionAttribute.offset = 0;
            positionAttribute.size = 3;
            this._buffer.addAttributeLocation(positionAttribute);
            var vertices = [
                // x, y, z
                0, 0, 0,
                0, this._height, 0,
                this._width, this._height, 0,
                this._width, this._height, 0,
                this._width, 0.0, 0,
                0, 0, 0
            ];
            this._buffer.pushBackData(vertices);
            this._buffer.upload();
            this._buffer.unbind();
        };
        Sprite.prototype.update = function (time) {
        };
        Sprite.prototype.draw = function () {
            this._buffer.bind();
            this._buffer.draw();
        };
        return Sprite;
    }());
    LH.Sprite = Sprite;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Matrix4x4 = /** @class */ (function () {
        function Matrix4x4() {
            this._data = [];
            this._data = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ];
        }
        Object.defineProperty(Matrix4x4.prototype, "data", {
            get: function () {
                return this._data;
            },
            enumerable: true,
            configurable: true
        });
        Matrix4x4.identity = function () {
            return new Matrix4x4();
        };
        Matrix4x4.orthographic = function (left, right, bottom, top, nearClip, farClip) {
            var matrix = new Matrix4x4();
            var lr = 1.0 / (left - right);
            var bt = 1.0 / (bottom - top);
            var nf = 1.0 / (nearClip - farClip);
            matrix._data[0] = -2.0 * lr;
            matrix._data[5] = -2.0 * bt;
            matrix._data[11] = 2.0 * nf;
            matrix._data[12] = (left + right) * lr;
            matrix._data[13] = (bottom + top) * bt;
            matrix._data[14] = (nearClip + farClip) * nf;
            return matrix;
        };
        Matrix4x4.translation = function (position) {
            var matrix = new Matrix4x4();
            matrix._data[12] = position.x;
            matrix._data[13] = position.y;
            matrix._data[14] = position.z;
            return matrix;
        };
        return Matrix4x4;
    }());
    LH.Matrix4x4 = Matrix4x4;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Vector3 = /** @class */ (function () {
        function Vector3(x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            this._x = x;
            this._y = y;
            this._z = z;
        }
        Object.defineProperty(Vector3.prototype, "x", {
            get: function () {
                return this._x;
            },
            set: function (value) {
                this._x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (value) {
                this._y = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "z", {
            get: function () {
                return this._z;
            },
            set: function (value) {
                this._z = value;
            },
            enumerable: true,
            configurable: true
        });
        Vector3.prototype.toArray = function () {
            return [this._x, this._y, this._z];
        };
        Vector3.prototype.toFloat32Array = function () {
            return new Float32Array(this.toArray());
        };
        Vector3.prototype.add = function (vector) {
            this._x += vector._x;
            this._y += vector._y;
            this._z += vector._z;
            return this;
        };
        Vector3.prototype.sub = function (vector) {
            this._x -= vector._x;
            this._y -= vector._y;
            this._z -= vector._z;
            return this;
        };
        return Vector3;
    }());
    LH.Vector3 = Vector3;
})(LH || (LH = {}));
