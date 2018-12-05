var LH;
(function (LH) {
    var Engine = /** @class */ (function () {
        function Engine() {
            console.log("Engine created.");
        }
        Engine.prototype.start = function () {
            this.canvas = LH.GLUtilities.initialize("pathTracer");
            LH.gl.clearColor(0, 0, 0, 1);
            this.tick();
        };
        Engine.prototype.tick = function () {
            //this.frameCount++;
            //document.body.innerHTML = this.frameCount.toString();
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT);
            requestAnimationFrame(this.tick.bind(this));
        };
        return Engine;
    }());
    LH.Engine = Engine;
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
            LH.gl = canvas.getContext("webgl");
            if (LH.gl === undefined) {
                throw new Error("Unable to initialize WebGL!");
            }
            return canvas;
        };
        return GLUtilities;
    }());
    LH.GLUtilities = GLUtilities;
})(LH || (LH = {}));
// entry point
window.onload = function () {
    var engine = new LH.Engine();
    engine.start();
};
