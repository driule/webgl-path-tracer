"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
// import { glMatrix } from "gl-matrix";
var glMatrix = require("gl-matrix");
var Camera = /** @class */ (function () {
    function Camera(canvas, initialView, movementSpeed) {
        if (initialView === void 0) { initialView = [0.2, 5.75, 50.0]; }
        if (movementSpeed === void 0) { movementSpeed = 0.1; }
        this._canvas = canvas;
        this._angleX = initialView[0];
        this._angleY = initialView[1];
        this._zoomZ = initialView[2];
        this._axisX = 0.0;
        this._axisY = 0.0;
        this._axisZ = 0.0;
        this._movementSpeed = movementSpeed;
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
    Camera.prototype.zoomIn = function () {
        this._zoomZ -= this._movementSpeed;
    };
    Camera.prototype.zoomOut = function () {
        this._zoomZ += this._movementSpeed;
    };
    // rotatation controls
    Camera.prototype.rotateUp = function () {
        this._axisY += this._movementSpeed;
    };
    Camera.prototype.rotateDown = function () {
        this._axisY -= this._movementSpeed;
    };
    Camera.prototype.rotateRight = function () {
        this._axisX += this._movementSpeed;
    };
    Camera.prototype.rotateLeft = function () {
        this._axisX -= this._movementSpeed;
    };
    return Camera;
}());
exports.Camera = Camera;
// }
//# sourceMappingURL=Camera.js.map