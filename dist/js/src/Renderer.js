var LH;
(function (LH) {
    var Renderer = /** @class */ (function () {
        function Renderer(gauge) {
            this._canvas = LH.GLUtilities.initialize('pathTracer');
            this._pathTracer = new LH.PathTracer(this._canvas);
            this._gauge = gauge;
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
            this._scene.camera.calculateViewProjection();
            this._pathTracer.setScene(this._scene);
            this._pathTracer.restart();
        };
        Renderer.prototype.loadTexturedScene = function () {
            var lights = [
                new LH.Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new LH.Light([20.25, 125.75, 0.25], 1.5, 100.0),
                new LH.Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];
            var camera = new LH.Camera(this._canvas, [0.2, 5.75, 175.0], 2.0);
            this._scene = new LH.Scene(camera);
            this._scene.setLights(lights);
            // this._scene.loadModel('assets/models/cottage/cottage_obj.obj');
            // this._scene.loadModel('assets/models/mill/low-poly-mill.obj');
            // this._scene.loadModel('assets/models/earth/earth.obj');
            this._scene.loadModel('assets/models/spider/Only_Spider_with_Animations_Export.obj');
            this.restart();
        };
        Renderer.prototype.loadTeddyScene = function () {
            var lights = [
                new LH.Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new LH.Light([20.25, 22.75, 0.25], 1.5, 10.0),
                new LH.Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];
            var camera = new LH.Camera(this._canvas, [0.2, 5.75, 75.0], 2.0);
            this._scene = new LH.Scene(camera);
            this._scene.setLights(lights);
            this._scene.loadModel('assets/models/teddy.obj');
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
//# sourceMappingURL=Renderer.js.map