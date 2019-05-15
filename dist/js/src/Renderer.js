"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
var PathTracer_1 = require("./PathTracer");
var Scene_1 = require("./Scene");
var Camera_1 = require("./Camera");
var Light_1 = require("./geometry/Light");
var Triangle_1 = require("./geometry/Triangle");
var GLUtilities_1 = require("./gl/GLUtilities");
var GLUtilities_2 = require("./gl/GLUtilities");
var Renderer = /** @class */ (function () {
    function Renderer(gauge) {
        this._canvas = GLUtilities_1.GLUtilities.initialize('pathTracer');
        this._pathTracer = new PathTracer_1.PathTracer(this._canvas);
        this._gauge = gauge;
    }
    Renderer.prototype.start = function () {
        GLUtilities_2.gl.clearColor(0, 0, 0, 1);
        GLUtilities_2.gl.clear(GLUtilities_2.gl.COLOR_BUFFER_BIT | GLUtilities_2.gl.DEPTH_BUFFER_BIT);
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
            new Light_1.Light([0.0, 5.75, 20.25], 0.25, 35.0),
            new Light_1.Light([20.25, 125.75, 0.25], 1.5, 100.0),
            new Light_1.Light([-20.25, 20.75, 0.25], 0.15, 15.0)
        ];
        var camera = new Camera_1.Camera(this._canvas, [0.2, 5.75, 175.0], 2.0);
        this._scene = new Scene_1.Scene(camera);
        this._scene.setLights(lights);
        // this._scene.loadModel('assets/models/cottage/cottage_obj.obj');
        // this._scene.loadModel('assets/models/mill/low-poly-mill.obj');
        // this._scene.loadModel('assets/models/earth/earth.obj');
        this._scene.loadModel('assets/models/spider/Only_Spider_with_Animations_Export.obj');
        this.restart();
    };
    Renderer.prototype.loadTeddyScene = function () {
        var lights = [
            new Light_1.Light([0.0, 5.75, 20.25], 0.25, 35.0),
            new Light_1.Light([20.25, 22.75, 0.25], 1.5, 10.0),
            new Light_1.Light([-20.25, 20.75, 0.25], 0.15, 15.0)
        ];
        var camera = new Camera_1.Camera(this._canvas, [0.2, 5.75, 75.0], 2.0);
        this._scene = new Scene_1.Scene(camera);
        this._scene.setLights(lights);
        this._scene.loadModel('assets/models/teddy.obj');
        // this._scene.loadModel('assets/teddy.obj', [40, 0, 0]);
        this.restart();
    };
    Renderer.prototype.loadBasicScene = function () {
        var lights = [
            new Light_1.Light([0.0, 1.75, 0.25], 0.25, 12.5),
        ];
        var camera = new Camera_1.Camera(this._canvas, [0.0, 0.0, 2.5]);
        this._scene = new Scene_1.Scene(camera);
        this._scene.setLights(lights);
        this._scene.setTriangles([
            // ground plane
            new Triangle_1.Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, 0.75], [0.75, -0.95, -0.75]),
            new Triangle_1.Triangle([-0.75, -0.95, -0.75], [-0.75, -0.95, 0.75], [0.75, -0.95, 0.75]),
            // left wall
            new Triangle_1.Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]),
            new Triangle_1.Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75], [-0.75, 0.95, 0.75]),
            // back wall
            new Triangle_1.Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, -0.75], [-0.75, 0.95, -0.75]),
            new Triangle_1.Triangle([0.75, -0.95, -0.75], [0.75, 0.95, -0.75], [-0.75, 0.95, -0.75])
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
exports.Renderer = Renderer;
// }
//# sourceMappingURL=Renderer.js.map