var LH;
(function (LH) {
    var Camera = /** @class */ (function () {
        function Camera(canvas, initialView) {
            if (initialView === void 0) { initialView = [0.2, 5.75, 50.0]; }
            this._canvas = canvas;
            this._angleX = initialView[0];
            this._angleY = initialView[1];
            this._zoomZ = initialView[2];
            this._axisX = 0.0;
            this._axisY = 0.0;
            this._axisZ = 0.0;
            this._eye = glMatrix.vec3.create();
            this.calculateViewProjection();
        }
        Object.defineProperty(Camera.prototype, "eye", {
            get: function () {
                return this._eye;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "viewProjectionMatrix", {
            get: function () {
                return this._viewProjectionMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Camera.prototype.calculateViewProjection = function () {
            this._eye[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
            this._eye[1] = this._zoomZ * Math.sin(this._angleX);
            this._eye[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);
            var view = glMatrix.mat4.lookAt([], this._eye, [this._axisX, this._axisY, this._axisZ], [0, 1, 0]);
            var projection = glMatrix.mat4.perspective([], Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
            this._viewProjectionMatrix = glMatrix.mat4.multiply([], projection, view);
            this._viewProjectionMatrix = glMatrix.mat4.invert([], this._viewProjectionMatrix);
        };
        Camera.prototype.getEyeRay = function (x, y) {
            // jitter view-projection matrix for anti-aliasing
            var jitterVector = [(Math.random() * 2 - 1) / this._canvas.width, (Math.random() * 2 - 1) / this._canvas.height, 0];
            var viewProjectionMatrix = glMatrix.mat4.translate([], this._viewProjectionMatrix, jitterVector);
            var transformedVector = glMatrix.vec4.transformMat4([], [x, y, 0, 1], viewProjectionMatrix);
            var scaledVector = glMatrix.vec4.scale([], transformedVector, 1.00 / transformedVector[3]);
            return glMatrix.vec3.subtract([], [scaledVector[0], scaledVector[1], scaledVector[2]], this._eye);
        };
        // movement controls
        Camera.prototype.moveUp = function (step) {
            if (step === void 0) { step = 0.1; }
            this._angleX += step;
        };
        Camera.prototype.moveDown = function (step) {
            if (step === void 0) { step = 0.1; }
            this._angleX -= step;
        };
        Camera.prototype.moveRight = function (step) {
            if (step === void 0) { step = 0.1; }
            this._angleY += step;
        };
        Camera.prototype.moveLeft = function (step) {
            if (step === void 0) { step = 0.1; }
            this._angleY -= step;
        };
        Camera.prototype.zoomIn = function (step) {
            if (step === void 0) { step = 0.1; }
            this._zoomZ -= step;
        };
        Camera.prototype.zoomOut = function (step) {
            if (step === void 0) { step = 0.1; }
            this._zoomZ += step;
        };
        // rotatation controls
        Camera.prototype.rotateUp = function (step) {
            if (step === void 0) { step = 0.1; }
            this._axisY += step;
        };
        Camera.prototype.rotateDown = function (step) {
            if (step === void 0) { step = 0.1; }
            this._axisY -= step;
        };
        Camera.prototype.rotateRight = function (step) {
            if (step === void 0) { step = 0.1; }
            this._axisX += step;
        };
        Camera.prototype.rotateLeft = function (step) {
            if (step === void 0) { step = 0.1; }
            this._axisX -= step;
        };
        return Camera;
    }());
    LH.Camera = Camera;
})(LH || (LH = {}));
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
            this._tracerShader = new LH.Shader('tracer', loadFile('shaders/tracer.vertex.glsl'), loadFile('shaders/tracer.fragment.glsl'));
            this._renderShader = new LH.Shader('render', loadFile('shaders/render.vertex.glsl'), loadFile('shaders/render.fragment.glsl'));
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
        }
        PathTracer.prototype.update = function (timeSinceStart) {
            // calculate uniforms
            var uniforms = {};
            uniforms.resolution = this._resolution;
            uniforms.eye = this._scene.camera.eye;
            uniforms.ray00 = this._scene.camera.getEyeRay(-1, -1);
            uniforms.ray01 = this._scene.camera.getEyeRay(-1, +1);
            uniforms.ray10 = this._scene.camera.getEyeRay(+1, -1);
            uniforms.ray11 = this._scene.camera.getEyeRay(+1, +1);
            uniforms.timeSinceStart = timeSinceStart;
            uniforms.textureWeight = this._sampleCount / (this._sampleCount + 1);
            // triangle data
            uniforms.triangles = this._scene.triangles;
            uniforms.totalTriangles = this._scene.triangles.length;
            uniforms.triangleDataTextureSize = Math.ceil(Math.sqrt(this._scene.triangles.length * 3));
            // BVH data
            uniforms.bvhNodeList = this._scene.bvh.nodeStack;
            uniforms.totalBvhNodes = uniforms.bvhNodeList.length;
            // {min}, {max}, {isLeaf, first, count}, {left, right, 0} - 4 rgb units
            uniforms.bvhDataTextureSize = Math.ceil(Math.sqrt(this._scene.bvh.nodeStack.length * 4));
            uniforms.triangleIndices = this._scene.bvh.triangleIndices;
            uniforms.triangleIndicesDataTextureSize = Math.ceil(Math.sqrt(uniforms.triangleIndices.length));
            // light data
            uniforms.lights = this._scene.lights;
            uniforms.totalLights = this._scene.lights.length;
            uniforms.lightDataTextureSize = Math.ceil(Math.sqrt(this._scene.lights.length * 2));
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
        PathTracer.prototype.setScene = function (scene) {
            this._scene = scene;
            this.restart();
        };
        PathTracer.prototype.restart = function () {
            this._sampleCount = 0;
        };
        return PathTracer;
    }());
    LH.PathTracer = PathTracer;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Renderer = /** @class */ (function () {
        function Renderer(gauge) {
            this._canvas = LH.GLUtilities.initialize('pathTracer');
            this._gauge = gauge;
            this._pathTracer = new LH.PathTracer([this._canvas.width, this._canvas.height]);
        }
        Renderer.prototype.start = function () {
            LH.gl.clearColor(0, 0, 0, 1);
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT | LH.gl.DEPTH_BUFFER_BIT);
            this.loadTeddyScene();
            this._isRendering = true;
            var startTime = Date.now();
            this.tick((Date.now() - startTime) * 0.001);
        };
        Renderer.prototype.tick = function (timeSinceStart) {
            this._pathTracer.update(timeSinceStart);
            this._pathTracer.render();
            this._gauge.measureFPS();
            if (this._isRendering) {
                requestAnimationFrame(this.tick.bind(this));
            }
        };
        Renderer.prototype.pause = function () {
            this._isRendering = false;
        };
        Renderer.prototype.resume = function () {
            this._isRendering = true;
        };
        Renderer.prototype.restart = function () {
            this._gauge.primitiveCount = this._scene.triangles.length;
            this._pathTracer.setScene(this._scene);
            this._scene.camera.calculateViewProjection();
            this._pathTracer.restart();
        };
        Renderer.prototype.loadTeddyScene = function () {
            var lights = [
                new LH.Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new LH.Light([20.25, 22.75, 0.25], 1.5, 10.0),
                new LH.Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];
            var camera = new LH.Camera(this._canvas, [0.2, 5.75, 75.0]);
            this._scene = new LH.Scene(camera);
            this._scene.setLights(lights);
            this._scene.loadModel('assets/teddy.obj');
            // this._scene.loadModel('assets/teddy.obj', [40, 0, 0]);
            this.restart();
        };
        Renderer.prototype.loadBasicScene = function () {
            var lights = [
                new LH.Light([0.0, 1.75, 0.25], 0.25, 12.5),
            ];
            var camera = new LH.Camera(this._canvas, [0.0, 0.0, 2.5]);
            this._scene = new LH.Scene(camera);
            this._scene.setLights(lights);
            this._scene.setTriangles([
                // ground plane
                new LH.Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, 0.75], [0.75, -0.95, -0.75]),
                new LH.Triangle([-0.75, -0.95, -0.75], [-0.75, -0.95, 0.75], [0.75, -0.95, 0.75]),
                // left wall
                new LH.Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]),
                new LH.Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75], [-0.75, 0.95, 0.75]),
                // back wall
                new LH.Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, -0.75], [-0.75, 0.95, -0.75]),
                new LH.Triangle([0.75, -0.95, -0.75], [0.75, 0.95, -0.75], [-0.75, 0.95, -0.75])
            ]);
            this.restart();
        };
        //
        // camera controls
        //
        Renderer.prototype.moveUp = function () {
            this._scene.camera.moveUp();
            this.restart();
        };
        Renderer.prototype.moveDown = function () {
            this._scene.camera.moveDown();
            this.restart();
        };
        Renderer.prototype.moveRight = function () {
            this._scene.camera.moveRight();
            this.restart();
        };
        Renderer.prototype.moveLeft = function () {
            this._scene.camera.moveLeft();
            this.restart();
        };
        Renderer.prototype.zoomIn = function () {
            this._scene.camera.zoomIn();
            this.restart();
        };
        Renderer.prototype.zoomOut = function () {
            this._scene.camera.zoomOut();
            this.restart();
        };
        Renderer.prototype.rotateUp = function () {
            this._scene.camera.rotateUp();
            this.restart();
        };
        Renderer.prototype.rotateDown = function () {
            this._scene.camera.rotateDown();
            this.restart();
        };
        Renderer.prototype.rotateRight = function () {
            this._scene.camera.rotateRight();
            this.restart();
        };
        Renderer.prototype.rotateLeft = function () {
            this._scene.camera.rotateLeft();
            this.restart();
        };
        return Renderer;
    }());
    LH.Renderer = Renderer;
})(LH || (LH = {}));
var LH;
(function (LH) {
    var Scene = /** @class */ (function () {
        function Scene(camera) {
            this._camera = camera;
            this._bvh = new LH.BVH();
            this._triangles = [];
            this._lights = [];
        }
        Object.defineProperty(Scene.prototype, "camera", {
            get: function () {
                return this._camera;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "triangles", {
            get: function () {
                return this._triangles;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "lights", {
            get: function () {
                return this._lights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "bvh", {
            get: function () {
                return this._bvh;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.setLights = function (lights) {
            if (lights === void 0) { lights = []; }
            this._lights = lights;
        };
        Scene.prototype.setTriangles = function (triangles) {
            if (triangles === void 0) { triangles = []; }
            this._triangles = triangles;
            this._bvh.build(this._triangles);
        };
        Scene.prototype.loadModel = function (filePath, translation) {
            if (translation === void 0) { translation = [0, 0, 0]; }
            var triangles = [];
            var lines = loadFile(filePath).split('\n');
            var vertices = [];
            var faceIndexes = [];
            var meshVertices = [];
            // collect vertices and facets data
            for (var i = 0; i < lines.length; i++) {
                var parts = lines[i].split(" ");
                if (parts[0] === "v") {
                    vertices.push([+parts[1], +parts[2], +parts[3]]);
                }
                else if (parts[0] === "f") {
                    faceIndexes.push((+parts[1]) - 1);
                    faceIndexes.push((+parts[2]) - 1);
                    faceIndexes.push((+parts[3]) - 1);
                }
            }
            // build all mesh vertices
            for (var i = 0; i < faceIndexes.length; i++) {
                meshVertices.push([
                    vertices[faceIndexes[i]][0],
                    vertices[faceIndexes[i]][1],
                    vertices[faceIndexes[i]][2]
                ]);
            }
            for (var i = 0; i < meshVertices.length / 3; i++) {
                var a = glMatrix.vec3.add([], meshVertices[i * 3], translation);
                var b = glMatrix.vec3.add([], meshVertices[i * 3 + 1], translation);
                var c = glMatrix.vec3.add([], meshVertices[i * 3 + 2], translation);
                triangles.push(new LH.Triangle(a, b, c));
            }
            this._triangles = this._triangles.concat(triangles);
            this._bvh.build(this._triangles);
        };
        return Scene;
    }());
    LH.Scene = Scene;
})(LH || (LH = {}));
var renderer;
var gauge;
// initialize application when page loading
window.onload = function () {
    gauge = new LH.Gauge();
    renderer = new LH.Renderer(gauge);
    renderer.start();
    // primitive count and FPS measurement
    var fpsLabel = document.getElementById('fps');
    var primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function () {
        fpsLabel.innerHTML = gauge.fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = gauge.primitiveCount + " primitives loaded";
    }, 200);
    // control buttons event listeners
    addEventListeners();
    preventDefaultControls();
};
// handle keyboard input
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
    if (event.keyCode == 189) {
        renderer.zoomOut();
    }
    // +
    if (event.keyCode == 187) {
        renderer.zoomIn();
    }
    // ArrowUp
    if (event.keyCode == 38) {
        renderer.rotateUp();
    }
    // ArrowDown
    if (event.keyCode == 40) {
        renderer.rotateDown();
    }
    // ArrowLeft
    if (event.keyCode == 37) {
        renderer.rotateLeft();
    }
    // ArrowRight
    if (event.keyCode == 39) {
        renderer.rotateRight();
    }
    // numpad -
    if (event.keyCode == 109) {
        renderer.zoomOut();
    }
    // numpad +
    if (event.keyCode == 107) {
        renderer.zoomIn();
    }
};
function loadFile(filePath) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send(null);
    return xmlhttp.responseText;
}
function handleInput(command) {
    if (command == 'render') {
        renderer.resume();
        var start = Date.now();
        renderer.tick(Date.now() - start);
        var renderButton = document.getElementById(command);
        renderButton.disabled = true;
        var stopButton = document.getElementById('stop');
        stopButton.disabled = false;
    }
    else if (command == 'stop') {
        renderer.pause();
        var stopButton = document.getElementById(command);
        stopButton.disabled = true;
        var renderButton = document.getElementById('render');
        renderButton.disabled = false;
    }
    else if (command == 'changeScene1') {
        renderer.loadBasicScene();
    }
    else if (command == 'changeScene2') {
        renderer.loadTeddyScene();
    }
}
function onButtonDown(event) {
    var element = event.target;
    if (gauge.mouseDownId == 0) {
        if (element.id == 'moveUp') {
            gauge.mouseDownId = setInterval(function () { renderer.moveUp(); }, 100);
        }
        if (element.id == 'moveDown') {
            gauge.mouseDownId = setInterval(function () { renderer.moveDown(); }, 100);
        }
        if (element.id == 'moveLeft') {
            gauge.mouseDownId = setInterval(function () { renderer.moveLeft(); }, 100);
        }
        if (element.id == 'moveRight') {
            gauge.mouseDownId = setInterval(function () { renderer.moveRight(); }, 100);
        }
        if (element.id == 'zoomIn') {
            gauge.mouseDownId = setInterval(function () { renderer.zoomIn(); }, 100);
        }
        if (element.id == 'zoomOut') {
            gauge.mouseDownId = setInterval(function () { renderer.zoomOut(); }, 100);
        }
        if (element.id == 'rotateUp') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateUp(); }, 100);
        }
        if (element.id == 'rotateDown') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateDown(); }, 100);
        }
        if (element.id == 'rotateLeft') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateLeft(); }, 100);
        }
        if (element.id == 'rotateRight') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateRight(); }, 100);
        }
    }
}
function onButtonUp(event) {
    clearInterval(gauge.mouseDownId);
    gauge.mouseDownId = 0;
}
function addEventListeners() {
    document.getElementById('moveUp').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveUp').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveUp').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveUp').addEventListener('touchend', onButtonUp, false);
    document.getElementById('moveDown').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveDown').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveDown').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveDown').addEventListener('touchend', onButtonUp, false);
    document.getElementById('moveLeft').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveLeft').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveLeft').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveLeft').addEventListener('touchend', onButtonUp, false);
    document.getElementById('moveRight').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveRight').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveRight').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveRight').addEventListener('touchend', onButtonUp, false);
    document.getElementById('zoomIn').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('zoomIn').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('zoomIn').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('zoomIn').addEventListener('touchend', onButtonUp, false);
    document.getElementById('zoomOut').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('zoomOut').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('zoomOut').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('zoomOut').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateUp').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateUp').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateUp').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateUp').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateDown').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateDown').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateDown').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateDown').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateLeft').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateLeft').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateLeft').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateLeft').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateRight').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateRight').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateRight').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateRight').addEventListener('touchend', onButtonUp, false);
}
function preventDefaultControls() {
    window.addEventListener("keydown", function (e) {
        // space and arrow keys
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
}
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
            if (node.count <= 3 || depth >= 10) {
                node.isLeaf = true;
                return;
            }
            else {
                node.isLeaf = false;
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
            var bins = [];
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
                    binIndex = Math.min(binCount - 1, binIndex);
                    bins[binIndex].push(index);
                }
                // sort objects
                var count = 0;
                for (var i = 0; i < binCount; i++) {
                    for (var j = 0; j < bins[i].length; j++) {
                        this._triangleIndices[node.first + count] = bins[i][j];
                        count++;
                    }
                }
                // evaluate bin combinations
                for (var i = 0; i < binCount - 1; i++) {
                    var leftCount = 0, rightCount = 0;
                    for (var j = 0; j <= i; j++) {
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
        Object.defineProperty(BoundingBox.prototype, "center", {
            get: function () {
                return this._center;
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
            this._center = glMatrix.vec3.add([], this.min, glMatrix.vec3.scale([], glMatrix.vec3.subtract([], this.max, this.min), 0.5));
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
            var minX = Math.min(this._a[0], this._b[0], this._c[0]);
            var minY = Math.min(this._a[1], this._b[1], this._c[1]);
            var minZ = Math.min(this._a[2], this._b[2], this._c[2]);
            var maxX = Math.max(this._a[0], this._b[0], this._c[0]);
            var maxY = Math.max(this._a[1], this._b[1], this._c[1]);
            var maxZ = Math.max(this._a[2], this._b[2], this._c[2]);
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
            // gl.getExtension('EXT_color_buffer_float');
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
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.triangleDataTextureSize, uniforms.triangleDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, triangleList);
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
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.lightDataTextureSize, uniforms.lightDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, lightList);
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
                        }
                        else {
                            bvhNodeDataList[i * 3 * 4 + 9] = 0.0;
                            bvhNodeDataList[i * 3 * 4 + 10] = 0.0;
                        }
                        bvhNodeDataList[i * 3 * 4 + 11] = uniforms.bvhNodeList[i].id;
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE3);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.bvhDataTextureSize, uniforms.bvhDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, bvhNodeDataList);
                    var bvhDataLocation = LH.gl.getUniformLocation(this._program, "bvhDataTexture");
                    LH.gl.uniform1i(bvhDataLocation, 3);
                    continue;
                }
                // specific case for triangle indices
                if (name_1.toString() == "triangleIndices") {
                    var triangleIndices = new Float32Array(uniforms.triangleIndicesDataTextureSize * uniforms.triangleIndicesDataTextureSize * 3);
                    for (var i = 0; i < uniforms.triangleIndices.length; i++) {
                        triangleIndices[i * 3 + 0] = uniforms.triangleIndices[i];
                        triangleIndices[i * 3 + 1] = uniforms.triangleIndices[i];
                        triangleIndices[i * 3 + 2] = uniforms.triangleIndices[i];
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE4);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.triangleIndicesDataTextureSize, uniforms.triangleIndicesDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, triangleIndices);
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
var LH;
(function (LH) {
    var Gauge = /** @class */ (function () {
        function Gauge() {
            this.primitiveCount = 0;
            this.mouseDownId = 0;
            this._fps = 0;
            this._lastTick = Date.now();
            this._elapsedTime = 0;
            this._frameCount = 0;
        }
        Object.defineProperty(Gauge.prototype, "fps", {
            get: function () {
                return this._fps;
            },
            enumerable: true,
            configurable: true
        });
        Gauge.prototype.measureFPS = function () {
            var currentTick = new Date().getTime();
            this._frameCount++;
            this._elapsedTime += (currentTick - this._lastTick);
            this._lastTick = currentTick;
            if (this._elapsedTime >= 1000) {
                this._fps = this._frameCount;
                this._frameCount = 0;
                this._elapsedTime -= 1000;
            }
        };
        return Gauge;
    }());
    LH.Gauge = Gauge;
})(LH || (LH = {}));
