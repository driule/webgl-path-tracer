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
//# sourceMappingURL=GLUtilities.js.map