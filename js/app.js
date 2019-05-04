var LH;
(function (LH) {
    var PathTracer = /** @class */ (function () {
        function PathTracer(resolution) {
            this._resolution = resolution;
            // create framebuffer
            this._framebuffer = LH.gl.createFramebuffer();
            // create textures
            var type = LH.gl.getExtension('OES_texture_float') ? LH.gl.FLOAT : LH.gl.UNSIGNED_BYTE;
            this._textures = [];
            for (var i = 0; i < 2; i++) {
                this._textures.push(LH.gl.createTexture());
                LH.gl.bindTexture(LH.gl.TEXTURE_2D, this._textures[i]);
                LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB, this._resolution[0], this._resolution[1], 0, LH.gl.RGB, type, null);
            }
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, null);
            // create shaders
            this._tracerShader = new LH.Shader('tracer', tracerVertexSource, tracerFragmentSource);
            this._renderShader = new LH.Shader('render', renderVertexSource, renderFragmentSource);
            var renderVertexAttribute = new LH.AttributeInformation();
            renderVertexAttribute.location = this._renderShader.getAttributeLocation('vertex');
            renderVertexAttribute.offset = 0;
            renderVertexAttribute.size = 2;
            this._vertexBuffer = new LH.GLBuffer(2, LH.gl.FLOAT, LH.gl.ARRAY_BUFFER, LH.gl.TRIANGLE_STRIP);
            this._vertexBuffer.pushBackData([
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ]);
            this._vertexBuffer.addAttributeLocation(renderVertexAttribute);
            this._lights = [];
            this._triangles = [];
        }
        PathTracer.prototype.update = function (viewProjectionMatrix, timeSinceStart, eye) {
            // jitter view-projection matrix for anti-aliasing
            var jitterVector = [(Math.random() * 2 - 1) / this._resolution[0], (Math.random() * 2 - 1) / this._resolution[1], 0];
            viewProjectionMatrix = glMatrix.mat4.translate([], viewProjectionMatrix, jitterVector);
            // calculate uniforms
            var uniforms = {};
            uniforms.resolution = this._resolution;
            uniforms.eye = eye;
            uniforms.ray00 = this.getEyeRay(viewProjectionMatrix, -1, -1, eye);
            uniforms.ray01 = this.getEyeRay(viewProjectionMatrix, -1, +1, eye);
            uniforms.ray10 = this.getEyeRay(viewProjectionMatrix, +1, -1, eye);
            uniforms.ray11 = this.getEyeRay(viewProjectionMatrix, +1, +1, eye);
            uniforms.timeSinceStart = timeSinceStart;
            uniforms.textureWeight = this._sampleCount / (this._sampleCount + 1);
            // triangle data
            uniforms.triangles = this._triangles;
            uniforms.totalTriangles = this._triangles.length;
            uniforms.triangleDataTextureSize = Math.ceil(Math.sqrt(this._triangles.length * 3));
            // BVH data
            var bvh = this._bvh;
            // bvh.build(this._triangles);
            uniforms.bvhNodeList = bvh.nodeStack;
            uniforms.totalBvhNodes = uniforms.bvhNodeList.length;
            // console.log("wut?" + uniforms.totalBvhNodes);
            // {min}, {max}, {isLeaf, first, count}, {left, right, 0} - 4 rgb units
            uniforms.bvhDataTextureSize = Math.ceil(Math.sqrt(bvh.nodeStack.length * 4));
            // console.log(uniforms.bvhDataTextureSize);
            // console.log(uniforms.totalBvhNodes);
            uniforms.triangleIndices = bvh.triangleIndices;
            uniforms.triangleIndicesDataTextureSize = Math.ceil(Math.sqrt(uniforms.triangleIndices.length));
            // light data
            uniforms.lights = this._lights;
            uniforms.totalLights = this._lights.length;
            uniforms.lightDataTextureSize = Math.ceil(Math.sqrt(this._lights.length * 2));
            // set uniforms
            this._tracerShader.use();
            // render to texture
            LH.gl.activeTexture(LH.gl.TEXTURE0);
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this._textures[0]);
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, this._framebuffer);
            LH.gl.framebufferTexture2D(LH.gl.FRAMEBUFFER, LH.gl.COLOR_ATTACHMENT0, LH.gl.TEXTURE_2D, this._textures[1], 0);
            this._tracerShader.setUniforms(uniforms);
            this._vertexBuffer.upload();
            this._vertexBuffer.draw();
            // ping pong textures
            this._textures.reverse();
            this._sampleCount++;
        };
        PathTracer.prototype.render = function () {
            this._renderShader.use();
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, null);
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this._textures[0]);
            this._vertexBuffer.draw();
        };
        PathTracer.prototype.setObjects = function (triangles, lights, bvh) {
            this._triangles = triangles;
            this._lights = lights;
            this._bvh = bvh;
            this.restart();
        };
        PathTracer.prototype.restart = function () {
            this._sampleCount = 0;
        };
        PathTracer.prototype.getEyeRay = function (matrix, x, y, eye) {
            var transformedVector = glMatrix.vec4.transformMat4([], [x, y, 0, 1], matrix);
            var scaledVector = glMatrix.vec4.scale([], transformedVector, 1.00 / transformedVector[3]);
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
            this._pathTracer = new LH.PathTracer([this._canvas.width, this._canvas.height]);
            this._angleX = 0;
            this._angleY = 0;
            this._zoomZ = 40.0;
            this._eye = glMatrix.vec3.create();
        }
        Renderer.prototype.start = function () {
            LH.gl.clearColor(0, 0, 0, 1);
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT | LH.gl.DEPTH_BUFFER_BIT);
            // create scene
            // let triangles = this.createTriangles();
            var triangles = this.loadObject('assets/teddy.obj');
            var bvh = new LH.BVH();
            bvh.build(triangles);
            console.log('bvh size: ' + bvh.nodeStack.length);
            var lights = [
                new LH.Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new LH.Light([20.25, 22.75, 0.25], 1.5, 10.0),
                new LH.Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];
            this._pathTracer.setObjects(triangles, lights, bvh);
            this.calculateViewProjection();
            primitiveCount = triangles.length;
            //var startTime = Date.now();
            //this.tick((Date.now() - startTime) * 0.001);
        };
        Renderer.prototype.tick = function (timeSinceStart) {
            this._pathTracer.update(this._viewProjection, timeSinceStart, this._eye);
            this._pathTracer.render();
            // fps measurement
            var currentTick = new Date().getTime();
            frameCount++;
            elapsedTime += (currentTick - lastTick);
            lastTick = currentTick;
            if (elapsedTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                elapsedTime -= 1000;
            }
            requestAnimationFrame(this.tick.bind(this));
        };
        Renderer.prototype.calculateViewProjection = function () {
            this._eye[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
            this._eye[1] = this._zoomZ * Math.sin(this._angleX);
            this._eye[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);
            var view = glMatrix.mat4.lookAt([], this._eye, [0, 0, 0], [0, 1, 0]);
            var projection = glMatrix.mat4.perspective([], Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
            this._viewProjection = glMatrix.mat4.multiply([], projection, view);
            this._viewProjection = glMatrix.mat4.invert([], this._viewProjection);
        };
        //
        // camera controls
        //
        Renderer.prototype.moveUp = function () {
            this._angleX += 0.1;
            this.restart();
        };
        Renderer.prototype.moveDown = function () {
            this._angleX -= 0.1;
            this.restart();
        };
        Renderer.prototype.moveRight = function () {
            this._angleY += 0.1;
            this.restart();
        };
        Renderer.prototype.moveLeft = function () {
            this._angleY -= 0.1;
            this.restart();
        };
        Renderer.prototype.zoomIn = function () {
            this._zoomZ -= 0.1;
            this.restart();
        };
        Renderer.prototype.zoomOut = function () {
            this._zoomZ += 0.1;
            this.restart();
        };
        Renderer.prototype.restart = function () {
            this._pathTracer.restart();
            this.calculateViewProjection();
        };
        //
        // scene objects
        //
        Renderer.prototype.createTriangles = function () {
            var objects = [];
            // for (let i = 0; i < 30; i++) {
            //     // ground plane
            //     objects.push(new Triangle([-0.75 + i - 3, -0.95, -0.75], [0.75 + i - 3, -0.95, 0.75], [0.75 + i - 3, -0.95, -0.75]));
            //     objects.push(new Triangle([-0.75 + i - 3, -0.95, -0.75], [-0.75+ i - 3, -0.95, 0.75], [0.75 + i - 3, -0.95, 0.75]));
            //     // left side
            //     //objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]));
            //     //objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75],  [-0.75, 0.95, 0.75]));
            //     // back side
            //     objects.push(new Triangle([-0.75 + i - 3, -0.95, -0.75], [0.75 + i - 3, -0.95, -0.75], [-0.75 + i - 3, 0.95, -0.75]));
            //     objects.push(new Triangle([0.75 + i - 3, -0.95, -0.75], [0.75 + i - 3, 0.95, -0.75], [-0.75 + i - 3, 0.95, -0.75]));
            // }
            // ground plane
            objects.push(new LH.Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, 0.75], [0.75, -0.95, -0.75]));
            objects.push(new LH.Triangle([-0.75, -0.95, -0.75], [-0.75, -0.95, 0.75], [0.75, -0.95, 0.75]));
            // left side
            objects.push(new LH.Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]));
            objects.push(new LH.Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75], [-0.75, 0.95, 0.75]));
            // back side
            objects.push(new LH.Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, -0.75], [-0.75, 0.95, -0.75]));
            objects.push(new LH.Triangle([0.75, -0.95, -0.75], [0.75, 0.95, -0.75], [-0.75, 0.95, -0.75]));
            return objects;
        };
        Renderer.prototype.loadObject = function (filePath) {
            var triangles = [];
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", filePath, false);
            xmlhttp.send(null);
            var fileContent = xmlhttp.responseText;
            var fileArray = fileContent.split('\n');
            var vertices = [];
            var faceIndexes = [];
            var meshVertices = [];
            // collect vertices and facets data
            for (var i = 0; i < fileArray.length; i++) {
                var line = fileArray[i];
                var parts = line.split(" ");
                if (parts[0] === "v") {
                    vertices.push([parts[1], parts[2], parts[3]]);
                }
                else if (parts[0] === "f") {
                    faceIndexes.push((+parts[1]) - 1);
                    faceIndexes.push((+parts[2]) - 1);
                    faceIndexes.push((+parts[3]) - 1);
                }
            }
            // build all mesh vertices
            for (var i = 0; i < faceIndexes.length; i++) {
                meshVertices.push([vertices[faceIndexes[i]][0], vertices[faceIndexes[i]][1], vertices[faceIndexes[i]][2]]);
            }
            var primitivesCount = meshVertices.length / 3;
            for (var i = 0; i < primitivesCount; i++) {
                var a = meshVertices[i * 3];
                var b = meshVertices[i * 3 + 1];
                var c = meshVertices[i * 3 + 2];
                triangles.push(new LH.Triangle(a, b, c));
            }
            return triangles;
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
var tracerFragmentSource = "\n    precision highp float;\n\n    #define MAX_TRIANGLES 10000\n    #define MAX_LIGHTS 256\n    #define MAX_ITERATIONS 10000\n    #define BOUNCES 2\n    #define EPSILON 0.0001\n    #define INFINITY 10000.0\n    #define STACK_SIZE 16\n\n    struct Sphere\n    {\n        vec3 center;\n        float radius;\n    };\n\n    struct Triangle\n    {\n        vec3 a, b, c;\n    };\n\n    struct Light\n    {\n        vec3 position;\n        float radius;\n        float intensity;\n    };\n\n    struct BoundingBox\n    {\n        vec3 min, max;\n        bool isLeaf;\n        int first, count;\n        int left, right;\n    };\n\n    uniform vec2 resolution;\n    uniform vec3 eye;\n    uniform float textureWeight;\n    uniform float timeSinceStart;\n    uniform sampler2D texture;\n\n    // geometry\n    uniform int totalTriangles;\n    uniform float triangleDataTextureSize;\n    uniform sampler2D triangleDataTexture;\n\n    // bvh\n    uniform int totalBvhNodes;\n    uniform float bvhDataTextureSize;\n    uniform sampler2D bvhDataTexture;\n\n    uniform float triangleIndicesDataTextureSize;\n    uniform sampler2D triangleIndicesDataTexture;\n\n    uniform int totalLights;\n    uniform float lightDataTextureSize;\n    uniform sampler2D lightDataTexture;\n\n    varying vec3 initialRay;\n\n    vec3 getValueFromTexture(sampler2D texture, float index, float size) {\n        float column = mod(index, size);\n        float row = floor(index / size);\n\n        vec2 uv = vec2((column + 0.5) / size, (row + 0.5) / size);\n\n        return texture2D(texture, uv).rgb;\n     }\n\n     Triangle fetchTriangle(int id) {\n         vec3 coordA = getValueFromTexture(triangleDataTexture, float(id * 3 + 0), triangleDataTextureSize);\n         vec3 coordB = getValueFromTexture(triangleDataTexture, float(id * 3 + 1), triangleDataTextureSize);\n         vec3 coordC = getValueFromTexture(triangleDataTexture, float(id * 3 + 2), triangleDataTextureSize);\n         \n         return Triangle(coordA, coordB, coordC);\n     }\n\n     Light fetchLight(int id) {\n         vec3 position = getValueFromTexture(lightDataTexture, float(id * 2), lightDataTextureSize);\n         vec3 featureVector = getValueFromTexture(lightDataTexture, float(id * 2 + 1), lightDataTextureSize);\n\n         float radius = featureVector[0];\n         float intensity = featureVector[1];\n         \n         return Light(position, radius, intensity);\n     }\n\n     BoundingBox fetchBoundingBox(int id) {\n\n        // if (id == 0) {\n        //     BoundingBox boundingBox;\n        //     boundingBox.min = vec3(-10.0, -10.0, -10.0);\n        //     boundingBox.max = vec3(10.0, 10.0, 10.0);;\n        //     boundingBox.isLeaf = true;\n        //     boundingBox.first = 0;\n        //     boundingBox.count = 1;\n        //     boundingBox.left = 0;\n        //     boundingBox.right = 0;\n\n        //     return boundingBox;\n        // }\n\n        vec3 min = getValueFromTexture(bvhDataTexture, float(id * 4 + 0), bvhDataTextureSize);\n        vec3 max = getValueFromTexture(bvhDataTexture, float(id * 4 + 1), bvhDataTextureSize);\n        vec3 data = getValueFromTexture(bvhDataTexture, float(id * 4 + 2), bvhDataTextureSize);\n        vec3 children = getValueFromTexture(bvhDataTexture, float(id * 4 + 3), bvhDataTextureSize);\n\n        BoundingBox boundingBox;\n        boundingBox.min = min;\n        boundingBox.max = max;\n        boundingBox.isLeaf = bool(int(data[0])); // fix float to bool conversion\n        // if (boundingBox.isLeaf) {\n        //     gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);\n        // }\n        boundingBox.first = int(data[1]);\n        boundingBox.count = int(data[2]);\n        boundingBox.left = int(children[0]);\n        boundingBox.right = int(children[1]);\n\n        return boundingBox;\n     }\n\n     int fetchTriangleIndex(int id) {\n         vec3 triangleIndex = getValueFromTexture(triangleIndicesDataTexture, float(id), triangleIndicesDataTextureSize);\n\n         return int(triangleIndex.x);\n     }\n\n    float intersectSphere(vec3 origin, vec3 ray, Sphere sphere) {\n        vec3 toSphere = origin - sphere.center;\n        float a = dot(ray, ray);\n        float b = 2.0 * dot(toSphere, ray);\n        float c = dot(toSphere, toSphere) - sphere.radius * sphere.radius;\n        float discriminant = b * b - 4.0 * a * c;\n\n        if (discriminant > 0.0) {\n            float t = (-b - sqrt(discriminant)) / (2.0 * a);\n            if (t >= EPSILON) return t;\n        }\n\n        return INFINITY;\n    }\n\n    float intersectTriangle(vec3 origin, vec3 ray, Triangle triangle) {\n        float t, u, v;\n\n        vec3 ab = triangle.b - triangle.a;\n        vec3 ac = triangle.c - triangle.a;\n        vec3 pvec = cross(ray, ac);\n        float det = dot(ab, pvec);\n    \n        float invDet = 1.0 / det;\n    \n        vec3 tvec = origin - triangle.a;\n        u = dot(tvec, pvec) * invDet;\n    \n        if (u < 0.0 || u > 1.0) return INFINITY;\n    \n        vec3 qvec = cross(tvec, ab);\n        v = dot(ray, qvec) * invDet;\n        if (v < 0.0 || u + v > 1.0) return INFINITY;\n    \n        t = dot(ac, qvec) * invDet;\n        if (t >= EPSILON)\n        {\n            return t;\n        }\n\n        return INFINITY;\n    }\n\n    // ToDo: remove hit as an argument (?)\n    vec3 getTriangleNormal(vec3 hit, Triangle triangle) {\n        return normalize(\n            cross(triangle.a - triangle.b, triangle.b - triangle.c)\n        );\n    }\n\n    bool isIntersectingBoundingBox(vec3 origin, vec3 ray, BoundingBox boundingBox)\n    {\n        vec3 invertedDirection = vec3(1.0 / ray.x, 1.0 / ray.y, 1.0 / ray.z);\n\n        float tmin, tmax, txmin, txmax, tymin, tymax, tzmin, tzmax;\n\n        txmin = (boundingBox.min.x - origin.x) * invertedDirection.x;\n        txmax = (boundingBox.max.x - origin.x) * invertedDirection.x;\n\n        tymin = (boundingBox.min.y - origin.y) * invertedDirection.y;\n        tymax = (boundingBox.max.y - origin.y) * invertedDirection.y;\n\n        tzmin = (boundingBox.min.z - origin.z) * invertedDirection.z;\n        tzmax = (boundingBox.max.z - origin.z) * invertedDirection.z;\n\n        tmin = min(txmin, txmax);\n        tmax = max(txmin, txmax);\n\n        tmin = max(tmin, min(tymin, tymax));\n        tmax = min(tmax, max(tymin, tymax));\n\n        tmin = max(tmin, min(tzmin, tzmax));\n        tmax = min(tmax, max(tzmin, tzmax));\n        \n        if (tmax >= EPSILON && tmax >= tmin) {\n            return true;\n        }\n        return false;\n\n        // ToDo: check\n        // early out\n        // if (tmin > ray->t)\n        //     return false;\n\n        // ToDo: use EPSILON (?)\n        // return tmax >= tmin && tmax >= 0.0;\n    }\n\n    BoundingBox pop(BoundingBox stack[STACK_SIZE], int stackPointer) {\n        \n        BoundingBox node;\n        for (int i = 0; i < STACK_SIZE; i++) {\n            if (i == stackPointer - 1) {\n                node = stack[i];\n                break;\n            }\n        }\n\n        return node;\n    }\n    \n    void push(inout BoundingBox[STACK_SIZE] stack, int stackPointer, BoundingBox node) {\n        for (int i = 0; i < STACK_SIZE; i++) {\n            if (i == stackPointer) stack[i] = node;\n        }\n    }\n\n    // intersect bounding box test\n    // int intersectPrimitives(vec3 origin, vec3 ray)\n    // {\n    //     if (isIntersectingBoundingBox(origin, ray, fetchBoundingBox(0))) {\n    //         gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n    //     };\n    //     return 0;\n    // }\n\n    // traverse BVH to perform ray-primitive intersection\n    int intersectPrimitives(vec3 origin, vec3 ray)\n    {\n        float t = INFINITY;\n        int triangleId = 0;\n\n        // ToDo: check size\n        int stackPointer = 0;\n        BoundingBox stack[STACK_SIZE];\n\n        BoundingBox node = fetchBoundingBox(0);\n        push(stack, stackPointer, node);\n        stackPointer = stackPointer + 1;\n\n        for (int i = 0; i < MAX_ITERATIONS; i++) {\n\n            // if stack is empty, stop traversing\n            if (stackPointer <= 0) break;\n\n            node = pop(stack, stackPointer);\n            stackPointer = stackPointer - 1;\n\n            if (!isIntersectingBoundingBox(origin, ray, node)) continue;\n            \n            if (node.isLeaf) {\n                // intersect triangles inside the node\n\n                for (int j = 0; j < MAX_TRIANGLES; j++) {\n                    if (node.first + j >= node.first + node.count) break;\n    \n                    int index = fetchTriangleIndex(node.first + j);\n                    Triangle triangle = fetchTriangle(index);\n                    float tTriangle = intersectTriangle(origin, ray, triangle);\n                    if (tTriangle < t) {\n                        t = tTriangle;\n                        triangleId = index;\n                    }\n                }\n            } else {\n                // traverse left and right; push left and right nodes to the stack\n                \n                push(stack, stackPointer, fetchBoundingBox(node.left));\n                stackPointer = stackPointer + 1;\n\n                push(stack, stackPointer, fetchBoundingBox(node.right));\n                stackPointer = stackPointer + 1;\n            }\n        }\n\n        return triangleId;\n    }\n\n    float random(vec3 scale, float seed) {\n        return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n    }\n\n    vec3 cosineWeightedDirection(float seed, vec3 normal) {\n        float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n        float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n        float r = sqrt(u);\n        float angle = 6.283185307179586 * v;\n\n        vec3 sdir, tdir;\n        if (abs(normal.x) < 0.5) {\n            sdir = cross(normal, vec3(1, 0, 0));\n        } else {\n            sdir = cross(normal, vec3(0, 1, 0));\n        }\n        tdir = cross(normal, sdir);\n\n        return r * cos(angle) * sdir + r * sin(angle) * tdir + sqrt(1.0 - u) * normal;\n    }\n\n    vec3 uniformlyRandomDirection(float seed) {\n        float u = random(vec3(12.9898, 78.233, 151.7182), seed);\n        float v = random(vec3(63.7264, 10.873, 623.6736), seed);\n        float z = 1.0 - 2.0 * u;\n        float r = sqrt(1.0 - z * z);\n        float angle = 6.283185307179586 * v;\n\n        return vec3(r * cos(angle), r * sin(angle), z);\n    }\n\n    vec3 uniformlyRandomVector(float seed) {\n        return uniformlyRandomDirection(seed) * sqrt(random(vec3(36.7539, 50.3658, 306.2759), seed));\n    }\n\n    float getShadowIntensity(vec3 origin, vec3 ray) {\n        for (int i = 0; i < MAX_TRIANGLES; i++) {\n            if (i >= totalTriangles) break;\n            \n            float tTriangle = intersectTriangle(\n                origin,\n                ray,\n                fetchTriangle(i)\n            );\n            if (tTriangle < 1.0) return 0.0;\n        }\n        \n        return 1.0;\n    }\n\n    Light getRandomLight() {\n        for (int i = 0; i < MAX_LIGHTS; i++) {\n\n            // use loop index as a seed to get different number for each iteration\n            float randomValue = random(vec3(12.9898, 78.233, 151.7182), timeSinceStart + float(i));\n\n            if (randomValue < float(1.0 / float(totalLights))) {\n                return fetchLight(i);\n            }\n        }\n\n        return fetchLight(0);\n    }\n\n    vec3 calculateColor(vec3 origin, vec3 ray) {\n        vec3 accumulatedColor = vec3(0.0);\n        vec3 surfaceColor = vec3(0.75);\n        vec3 lightColor = vec3(1.0, 1.0, 0.85);\n        vec3 colorMask = vec3(1.0);\n\n        Light light;\n        \n        for (int bounce = 0; bounce < BOUNCES; bounce++) {\n            float t = INFINITY;\n            vec3 normal;\n            vec3 hit = origin + ray * t;\n\n            // for (int i = 0; i < MAX_TRIANGLES; i++) {\n            //     if (i >= totalTriangles) break;\n\n            //     Triangle triangle = fetchTriangle(i);\n            //     float tTriangle = intersectTriangle(origin, ray, triangle);\n            //     if (tTriangle < t) {\n            //         t = tTriangle;\n            //         hit = origin + ray * t;\n            //         normal = getTriangleNormal(hit, triangle);\n            //         surfaceColor = vec3(0.25, 0.00, 0.00);\n            //     }\n            // }\n\n            int i = intersectPrimitives(origin, ray);\n\n            Triangle triangle = fetchTriangle(i);\n            float tTriangle = intersectTriangle(origin, ray, triangle);\n            if (tTriangle < t) {\n                t = tTriangle;\n                hit = origin + ray * t;\n                normal = getTriangleNormal(hit, triangle);\n                surfaceColor = vec3(0.25, 0.00, 0.00);\n            }\n\n            // Triangle triangle = fetchTriangle(triangleId);\n            // float tTriangle = intersectTriangle(origin, ray, triangle);\n            // if (tTriangle < t) {\n            //     t = tTriangle;\n            //     hit = origin + ray * t;\n            //     normal = getTriangleNormal(hit, triangle);\n            //     surfaceColor = vec3(0.25, 0.00, 0.00);\n            // }\n\n            float tLight = INFINITY;\n            for (int i = 0; i < MAX_LIGHTS; i++) {\n                if (i >= totalLights) break;\n\n                light = fetchLight(i);\n                tLight = intersectSphere(origin, ray, Sphere(light.position, light.radius));\n                \n                if (tLight < t) {\n                    accumulatedColor += colorMask * lightColor;\n                    break;\n                }\n            }\n            \n            if (t == INFINITY || tLight < t) {\n                break;\n            } else {\n                ray = cosineWeightedDirection(timeSinceStart + float(bounce), normal);\n            }\n\n            light = getRandomLight();\n\n            vec3 toLight = (light.position + uniformlyRandomVector(timeSinceStart - 50.0) * light.radius) - hit;\n            float diffuse = max(0.0, dot(normalize(toLight), normal));\n            float shadowIntensity = getShadowIntensity(hit + normal * EPSILON, toLight);\n            \n            colorMask *= surfaceColor;\n            accumulatedColor += colorMask * surfaceColor * (lightColor * light.intensity * diffuse * shadowIntensity);\n            \n            origin = hit;\n        }\n        \n        return accumulatedColor;\n    }\n\n    void main() {\n        vec3 texture = texture2D(texture, gl_FragCoord.xy / resolution).rgb;\n        gl_FragColor = vec4(mix(calculateColor(eye, initialRay), texture, textureWeight), 1.0);\n\n        // debug mode\n        // vec4(mix(calculateColor(eye, initialRay), texture, textureWeight), 1.0);\n    }\n";
var renderer;
// fps measurement
var lastTick = Date.now();
var fps = 0;
var elapsedTime = 0;
var frameCount = 0;
var primitiveCount = 0;
window.onload = function () {
    renderer = new LH.Renderer();
    renderer.start();
    var start = Date.now();
    renderer.tick(Date.now() - start);
    // TODO: always use requestAnimationFrame() over setInterval()
    //setInterval(function(){ renderer.tick((Date.now() - start) * 0.001); }, 1000 / 60);
    var fpsLabel = document.getElementById('fps');
    var primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function () {
        fpsLabel.innerHTML = fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = primitiveCount + " primitives loaded";
    }, 200);
};
document.onkeydown = function (event) {
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
var LH;
(function (LH) {
    var BVH = /** @class */ (function () {
        function BVH() {
        }
        Object.defineProperty(BVH.prototype, "root", {
            get: function () {
                return this._root;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BVH.prototype, "triangleIndices", {
            get: function () {
                return this._triangleIndices;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BVH.prototype, "nodeStack", {
            get: function () {
                return this._nodeStack;
            },
            enumerable: true,
            configurable: true
        });
        BVH.prototype.build = function (triangles) {
            this._nodeStack = [];
            this._triangles = triangles;
            this._triangleIndices = new Array(this._triangles.length);
            for (var i = 0; i < this._triangles.length; i++) {
                this._triangleIndices[i] = i;
            }
            this._root = new LH.BoundingBox(0);
            this._root.first = 0;
            this._root.count = this._triangles.length;
            this._nodeStack.push(this._root);
            this.calculateBounds(this.root);
            this.subdivide(this.root, 0);
        };
        BVH.prototype.calculateBounds = function (node) {
            var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            var minX = Infinity, minY = Infinity, minZ = Infinity;
            for (var i = node.first; i < node.first + node.count; i++) {
                var index = this._triangleIndices[i];
                // console.log(index);
                minX = Math.min(this._triangles[index].boundingBox.min[0], minX);
                minY = Math.min(this._triangles[index].boundingBox.min[1], minY);
                minZ = Math.min(this._triangles[index].boundingBox.min[2], minZ);
                maxX = Math.max(this._triangles[index].boundingBox.max[0], maxX);
                maxY = Math.max(this._triangles[index].boundingBox.max[1], maxY);
                maxZ = Math.max(this._triangles[index].boundingBox.max[2], maxZ);
            }
            node.min = [minX, minY, minZ];
            node.max = [maxX, maxY, maxZ];
            node.calculateCenter();
        };
        BVH.prototype.subdivide = function (node, depth) {
            if (node.count <= 3 || depth >= 5) {
                node.isLeaf = true;
                return;
            }
            node.left = new LH.BoundingBox(this._nodeStack.length);
            this._nodeStack.push(node.left);
            node.right = new LH.BoundingBox(this._nodeStack.length);
            this._nodeStack.push(node.right);
            this.partition(node);
            depth++;
            this.subdivide(node.left, depth);
            this.subdivide(node.right, depth);
        };
        // determine left and right node primitives
        BVH.prototype.partition = function (node) {
            var optimalSAH = Infinity;
            var optimalLeftCount = 1;
            var optimalRightCount = node.count - optimalLeftCount;
            var optimalObjectIndices = new Array(node.count);
            for (var i = 0; i < node.count; i++) {
                optimalObjectIndices[i] = this._triangleIndices[node.first + i];
            }
            var binCount = 10;
            // std::vector<int>* bins = new std::vector<int>[binCount];
            var bins = [];
            // let binWidth = (node.max - node.min) / binCount; // gl-matrix
            var binWidth = glMatrix.vec3.subtract([], node.max, node.min);
            binWidth[0] = Math.floor(binWidth[0] / binCount);
            binWidth[1] = Math.floor(binWidth[1] / binCount);
            binWidth[2] = Math.floor(binWidth[2] / binCount);
            if (binWidth[0] == 0)
                binWidth[0] = 1;
            if (binWidth[1] == 0)
                binWidth[1] = 1;
            if (binWidth[2] == 0)
                binWidth[2] = 1;
            for (var axis = 0; axis < 3; axis++) {
                // for (let i = 0; i < binCount; i++) bins[i].clear();
                for (var i = 0; i < binCount; i++)
                    bins[i] = [];
                // divide objects to bins
                for (var i = node.first; i < node.first + node.count; i++) {
                    var index = this._triangleIndices[i], binIndex = void 0;
                    if (axis == 0)
                        binIndex = Math.floor((this._triangles[index].boundingBox.center[0] - node.min[0]) / binWidth[0]);
                    else if (axis == 1)
                        binIndex = Math.floor((this._triangles[index].boundingBox.center[1] - node.min[1]) / binWidth[1]);
                    else if (axis == 2)
                        binIndex = Math.floor((this._triangles[index].boundingBox.center[2] - node.min[2]) / binWidth[2]);
                    // console.log(binCount);
                    // console.log(binIndex);
                    binIndex = Math.min(binCount - 1, binIndex);
                    // bins[binIndex].push_back(index);
                    // console.log(index);
                    // console.log(binIndex);
                    bins[binIndex].push(index);
                }
                // sort objects
                var count = 0;
                for (var i = 0; i < binCount; i++) {
                    // for (let j = 0; j < bins[i].size(); j++)
                    for (var j = 0; j < bins[i].length; j++) {
                        this._triangleIndices[node.first + count] = bins[i][j];
                        count++;
                    }
                }
                // evaluate bin combinations
                for (var i = 0; i < binCount - 1; i++) {
                    var leftCount = 0, rightCount = 0;
                    for (var j = 0; j <= i; j++) {
                        // leftCount += bins[j].size();
                        leftCount += bins[j].length;
                    }
                    rightCount = node.count - leftCount;
                    if (leftCount == 0 || rightCount == 0)
                        continue;
                    node.left.first = node.first;
                    node.left.count = leftCount;
                    this.calculateBounds(node.left);
                    node.right.first = node.first + leftCount;
                    node.right.count = rightCount;
                    this.calculateBounds(node.right);
                    // calculate surface area
                    var surfaceAreaLeft = node.left.calculateSurfaceArea();
                    var surfaceAreaRight = node.right.calculateSurfaceArea();
                    var SAH = surfaceAreaLeft * node.left.count + surfaceAreaRight * node.right.count;
                    // save the optimal split according Surface Area Heuristic
                    if (SAH < optimalSAH && SAH < (surfaceAreaLeft + surfaceAreaRight) * node.count) {
                        optimalSAH = SAH;
                        optimalLeftCount = leftCount;
                        optimalRightCount = rightCount;
                        for (var j = 0; j < node.count; j++) {
                            optimalObjectIndices[j] = this._triangleIndices[node.first + j];
                        }
                    }
                }
            }
            // set optimal split values
            for (var i = 0; i < node.count; i++) {
                this._triangleIndices[node.first + i] = optimalObjectIndices[i];
            }
            node.left.first = node.first;
            node.left.count = optimalLeftCount;
            this.calculateBounds(node.left);
            node.right.first = node.first + optimalLeftCount;
            node.right.count = optimalRightCount;
            this.calculateBounds(node.right);
        };
        return BVH;
    }());
    LH.BVH = BVH;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var BoundingBox = /** @class */ (function () {
        function BoundingBox(id) {
            this._id = id;
        }
        Object.defineProperty(BoundingBox.prototype, "id", {
            get: function () {
                return this._id;
            },
            enumerable: true,
            configurable: true
        });
        BoundingBox.prototype.calculateSurfaceArea = function () {
            var diagonal = glMatrix.vec3.subtract([], this.max, this.min);
            diagonal = [Math.abs(diagonal[0]), Math.abs(diagonal[1]), Math.abs(diagonal[2])];
            return ((diagonal[0] * diagonal[1]) + (diagonal[0] * diagonal[2]) + (diagonal[2] * diagonal[1])) * 2;
        };
        BoundingBox.prototype.calculateCenter = function () {
            // this.center = this.min + 0.5 * (this.max - this.min);
            this.center = glMatrix.vec3.add([], this.min, glMatrix.vec3.scale([], glMatrix.vec3.subtract([], this.max, this.min), 0.5));
        };
        return BoundingBox;
    }());
    LH.BoundingBox = BoundingBox;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Light = /** @class */ (function () {
        function Light(position, radius, intensity) {
            this._position = position;
            this._radius = radius;
            this._intensity = intensity;
        }
        Object.defineProperty(Light.prototype, "position", {
            get: function () {
                return this._position;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "intensity", {
            get: function () {
                return this._intensity;
            },
            enumerable: true,
            configurable: true
        });
        return Light;
    }());
    LH.Light = Light;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Triangle = /** @class */ (function () {
        function Triangle(a, b, c) {
            this._a = a;
            this._b = b;
            this._c = c;
            var minX = Math.min(Math.min(this.a[0], this.b[0]), this.c[0]);
            var minY = Math.min(Math.min(this.a[1], this.b[1]), this.c[1]);
            var minZ = Math.min(Math.min(this.a[2], this.b[2]), this.a[2]);
            var maxX = Math.max(Math.max(this.a[0], this.b[0]), this.c[0]);
            var maxY = Math.max(Math.max(this.a[1], this.b[1]), this.c[1]);
            var maxZ = Math.max(Math.max(this.a[2], this.b[2]), this.a[2]);
            this._boundingBox = new LH.BoundingBox(0);
            this._boundingBox.min = [minX, minY, minZ];
            this._boundingBox.max = [maxX, maxY, maxZ];
            this._boundingBox.calculateCenter();
        }
        Object.defineProperty(Triangle.prototype, "a", {
            get: function () {
                return this._a;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Triangle.prototype, "b", {
            get: function () {
                return this._b;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Triangle.prototype, "c", {
            get: function () {
                return this._c;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Triangle.prototype, "boundingBox", {
            get: function () {
                return this._boundingBox;
            },
            enumerable: true,
            configurable: true
        });
        return Triangle;
    }());
    LH.Triangle = Triangle;
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
            // use WebGL 2.0
            LH.gl = canvas.getContext("webgl2");
            if (LH.gl === undefined) {
                throw new Error("Unable to initialize WebGL!");
            }
            console.log(LH.gl.getParameter(LH.gl.SHADING_LANGUAGE_VERSION));
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
                // specific case for triangle data texture
                if (name_1.toString() === "triangles") {
                    var triangleList = new Float32Array(uniforms.triangleDataTextureSize * uniforms.triangleDataTextureSize * 3);
                    for (var i = 0; i < uniforms.totalTriangles; i++) {
                        triangleList[i * 3 * 3 + 0] = uniforms.triangles[i].a[0];
                        triangleList[i * 3 * 3 + 1] = uniforms.triangles[i].a[1];
                        triangleList[i * 3 * 3 + 2] = uniforms.triangles[i].a[2];
                        triangleList[i * 3 * 3 + 3] = uniforms.triangles[i].b[0];
                        triangleList[i * 3 * 3 + 4] = uniforms.triangles[i].b[1];
                        triangleList[i * 3 * 3 + 5] = uniforms.triangles[i].b[2];
                        triangleList[i * 3 * 3 + 6] = uniforms.triangles[i].c[0];
                        triangleList[i * 3 * 3 + 7] = uniforms.triangles[i].c[1];
                        triangleList[i * 3 * 3 + 8] = uniforms.triangles[i].c[2];
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE1);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB16F, uniforms.triangleDataTextureSize, uniforms.triangleDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, triangleList);
                    var triangleDataLocation = LH.gl.getUniformLocation(this._program, "triangleDataTexture");
                    LH.gl.uniform1i(triangleDataLocation, 1);
                    continue;
                }
                // specific case for light
                if (name_1.toString() === "lights") {
                    var lightList = new Float32Array(uniforms.lightDataTextureSize * uniforms.lightDataTextureSize * 3);
                    for (var i = 0; i < uniforms.totalLights; i++) {
                        lightList[i * 3 * 2 + 0] = uniforms.lights[i].position[0];
                        lightList[i * 3 * 2 + 1] = uniforms.lights[i].position[1];
                        lightList[i * 3 * 2 + 2] = uniforms.lights[i].position[2];
                        lightList[i * 3 * 2 + 3] = uniforms.lights[i].radius;
                        lightList[i * 3 * 2 + 4] = uniforms.lights[i].intensity;
                        lightList[i * 3 * 2 + 5] = 0.0;
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE2);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB16F, uniforms.lightDataTextureSize, uniforms.lightDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, lightList);
                    var lightDataLocation = LH.gl.getUniformLocation(this._program, "lightDataTexture");
                    LH.gl.uniform1i(lightDataLocation, 2);
                    continue;
                }
                // specific case for BVH
                if (name_1.toString() == "bvhNodeList") {
                    var bvhNodeDataList = new Float32Array(uniforms.bvhDataTextureSize * uniforms.bvhDataTextureSize * 3);
                    for (var i = 0; i < uniforms.totalBvhNodes; i++) {
                        bvhNodeDataList[i * 3 * 4 + 0] = uniforms.bvhNodeList[i].min[0];
                        bvhNodeDataList[i * 3 * 4 + 1] = uniforms.bvhNodeList[i].min[1];
                        bvhNodeDataList[i * 3 * 4 + 2] = uniforms.bvhNodeList[i].min[2];
                        bvhNodeDataList[i * 3 * 4 + 3] = uniforms.bvhNodeList[i].max[0];
                        bvhNodeDataList[i * 3 * 4 + 4] = uniforms.bvhNodeList[i].max[1];
                        bvhNodeDataList[i * 3 * 4 + 5] = uniforms.bvhNodeList[i].max[2];
                        bvhNodeDataList[i * 3 * 4 + 6] = uniforms.bvhNodeList[i].isLeaf;
                        bvhNodeDataList[i * 3 * 4 + 7] = uniforms.bvhNodeList[i].first;
                        bvhNodeDataList[i * 3 * 4 + 8] = uniforms.bvhNodeList[i].count;
                        if (!uniforms.bvhNodeList[i].isLeaf) {
                            bvhNodeDataList[i * 3 * 4 + 9] = uniforms.bvhNodeList[i].left.id;
                            bvhNodeDataList[i * 3 * 4 + 10] = uniforms.bvhNodeList[i].right.id;
                            // console.log(uniforms.bvhNodeList); exit();
                            bvhNodeDataList[i * 3 * 4 + 11] = 0.0;
                        }
                        else {
                            bvhNodeDataList[i * 3 * 4 + 9] = 0.0;
                            bvhNodeDataList[i * 3 * 4 + 10] = 0.0;
                            bvhNodeDataList[i * 3 * 4 + 11] = 0.0;
                        }
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE3);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB16F, uniforms.bvhDataTextureSize, uniforms.bvhDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, bvhNodeDataList);
                    var bvhDataLocation = LH.gl.getUniformLocation(this._program, "bvhDataTexture");
                    LH.gl.uniform1i(bvhDataLocation, 3);
                    continue;
                }
                // specific case for triangle indices
                if (name_1.toString() == "triangleIndices") {
                    var triangleIndices = new Float32Array(uniforms.triangleIndicesDataTextureSize * uniforms.triangleIndicesDataTextureSize * 3);
                    // triangleIndices = Uint32Array.from(uniforms.triangleIndices);
                    for (var i = 0; i < uniforms.triangleIndices.length; i++) {
                        triangleIndices[i * 3 + 0] = uniforms.triangleIndices[i];
                        triangleIndices[i * 3 + 1] = 0;
                        triangleIndices[i * 3 + 2] = 0;
                    }
                    // console.log(uniforms.triangleIndices.length);
                    // console.log(uniforms.triangleIndicesDataTextureSize);
                    LH.gl.activeTexture(LH.gl.TEXTURE4);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32UI, uniforms.triangleIndicesDataTextureSize, uniforms.triangleIndicesDataTextureSize, 0, gl.RED_INTEGER, gl.UNSIGNED_INT, triangleIndices);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB16F, uniforms.triangleIndicesDataTextureSize, uniforms.triangleIndicesDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, triangleIndices);
                    var triangleIndicesDataLocation = LH.gl.getUniformLocation(this._program, "triangleIndicesDataTexture");
                    LH.gl.uniform1i(triangleIndicesDataLocation, 4);
                    continue;
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
                var vector2Uniforms = [
                    "resolution"
                ];
                var matrix4Uniforms = [];
                var intUniforms = [
                    "totalTriangles",
                    "totalBvhNodes",
                    "totalLights"
                ];
                var floatUniforms = [
                    "timeSinceStart",
                    "textureWeight",
                    "triangleDataTextureSize",
                    "bvhDataTextureSize",
                    "triangleIndicesDataTextureSize",
                    "lightDataTextureSize"
                ];
                var value = uniforms[name_1];
                if (vector2Uniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform2fv(location_1, new Float32Array([value[0], value[1]]));
                }
                else if (vector3Uniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform3fv(location_1, new Float32Array([value[0], value[1], value[2]]));
                }
                else if (matrix4Uniforms.indexOf(name_1) > -1) {
                    // TODO: implement matrix uniform support
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
