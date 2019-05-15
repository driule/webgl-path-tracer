"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
var glMatrix = require("gl-matrix");
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
exports.BoundingBox = BoundingBox;
// }
//# sourceMappingURL=BoundingBox.js.map