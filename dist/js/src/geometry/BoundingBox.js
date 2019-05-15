"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
var gl_matrix_1 = require("gl-matrix");
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
        var diagonal = gl_matrix_1.glMatrix.vec3.subtract([], this.max, this.min);
        diagonal = [Math.abs(diagonal[0]), Math.abs(diagonal[1]), Math.abs(diagonal[2])];
        return ((diagonal[0] * diagonal[1]) + (diagonal[0] * diagonal[2]) + (diagonal[2] * diagonal[1])) * 2;
    };
    BoundingBox.prototype.calculateCenter = function () {
        this._center = gl_matrix_1.glMatrix.vec3.add([], this.min, gl_matrix_1.glMatrix.vec3.scale([], gl_matrix_1.glMatrix.vec3.subtract([], this.max, this.min), 0.5));
    };
    return BoundingBox;
}());
exports.BoundingBox = BoundingBox;
// }
//# sourceMappingURL=BoundingBox.js.map