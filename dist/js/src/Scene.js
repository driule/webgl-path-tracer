"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
var Triangle_1 = require("./geometry/Triangle");
var BVH_1 = require("./geometry/BVH");
var gl_matrix_1 = require("gl-matrix");
var app_1 = require("./app");
var Scene = /** @class */ (function () {
    function Scene(camera) {
        this._camera = camera;
        this._bvh = new BVH_1.BVH();
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
        var lines = app_1.loadFile(filePath).split('\n');
        var vertices = [];
        var faceIndexes = [];
        var meshVertices = [];
        // collect vertices and facets data
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].replace(/(\r\n|\n|\r)/gm, "");
            var parts = line.split(" ");
            parts = parts.filter(function (v) { return v != '' && v != ' '; });
            if (parts[0] === "v") {
                vertices.push([+parts[1], +parts[2], +parts[3]]);
            }
            else if (parts[0] === "f") {
                // triangle
                if (parts.length == 4) {
                    for (var j = 1; j < 4; j++) {
                        var v_vt_vn = parts[j].split("/");
                        faceIndexes.push((+v_vt_vn[0]) - 1);
                    }
                }
                else if (parts.length > 4) {
                    var v_vt_vn = void 0;
                    v_vt_vn = parts[1].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[2].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[3].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[1].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[3].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[4].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                }
                // faceIndexes.push((+parts[1]) - 1);
                // faceIndexes.push((+parts[2]) - 1);
                // faceIndexes.push((+parts[3]) - 1);
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
            var a = gl_matrix_1.glMatrix.vec3.add([], meshVertices[i * 3], translation);
            var b = gl_matrix_1.glMatrix.vec3.add([], meshVertices[i * 3 + 1], translation);
            var c = gl_matrix_1.glMatrix.vec3.add([], meshVertices[i * 3 + 2], translation);
            triangles.push(new Triangle_1.Triangle(a, b, c));
        }
        this._triangles = this._triangles.concat(triangles);
        this._bvh.build(this._triangles);
    };
    return Scene;
}());
exports.Scene = Scene;
// }
//# sourceMappingURL=Scene.js.map