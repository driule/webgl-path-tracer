var LH;
(function (LH) {
    var Engine = /** @class */ (function () {
        function Engine() {
            console.log("Engine created.");
        }
        Engine.prototype.start = function () {
            this._canvas = LH.GLUtilities.initialize("pathTracer");
            LH.gl.clearColor(0, 0, 0, 1);
            this.loadShaders();
            this._shader.use();
            this.tick();
        };
        Engine.prototype.resize = function () {
            if (this._canvas !== undefined) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
            }
        };
        Engine.prototype.tick = function () {
            //this.frameCount++;
            //document.body.innerHTML = this.frameCount.toString();
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT);
            requestAnimationFrame(this.tick.bind(this));
        };
        Engine.prototype.loadShaders = function () {
            var vertexShaderSource = "\n                attribute vec3 a_position;\n                void main() {\n                    gl_Position = vec4(a_position, 1.0);\n                }\n            ";
            var fragmentShaderSource = "\n                precision mediump float;\n                void main() {\n                    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);\n                }\n            ";
            this._shader = new LH.Shader("basic", vertexShaderSource, fragmentShaderSource);
        };
        return Engine;
    }());
    LH.Engine = Engine;
})(LH || (LH = {}));
// entry point
var engine;
window.onload = function () {
    engine = new LH.Engine();
    engine.start();
};
/*
window.onresize = function() {
    engine.resize();
}*/ 
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
var LH;
(function (LH) {
    var Shader = /** @class */ (function () {
        function Shader(name, vertexSource, fragmentSource) {
            this._name = name;
            var vertexShader = this.loadShader(vertexSource, LH.gl.VERTEX_SHADER);
            var fragmentShader = this.loadShader(fragmentSource, LH.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
        }
        Object.defineProperty(Shader.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Shader.prototype.use = function () {
            LH.gl.useProgram(this._program);
        };
        Shader.prototype.loadShader = function (source, shaderType) {
            var shader = LH.gl.createShader(shaderType);
            LH.gl.shaderSource(shader, source);
            LH.gl.compileShader(shader);
            var shaderInfoLog = LH.gl.getShaderInfoLog(shader);
            if (shaderInfoLog !== "") {
                throw new Error("Error compiling shader '" + this._name + "': " + shaderInfoLog);
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
                throw new Error("Error linking shader '" + this._name + "': " + programInfoLog);
            }
        };
        return Shader;
    }());
    LH.Shader = Shader;
})(LH || (LH = {}));
