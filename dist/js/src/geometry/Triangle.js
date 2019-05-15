"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
var BoundingBox_1 = require("./BoundingBox");
var glMatrix = require("gl-matrix");
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
        this._boundingBox = new BoundingBox_1.BoundingBox(0);
        this._boundingBox.min = glMatrix.vec3.fromValues(minX, minY, minZ);
        this._boundingBox.max = glMatrix.vec3.fromValues(maxX, maxY, maxZ);
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
exports.Triangle = Triangle;
// }
//# sourceMappingURL=Triangle.js.map