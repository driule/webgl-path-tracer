var LH;
(function (LH) {
    var Engine = /** @class */ (function () {
        function Engine() {
            this._frameCount = 0;
            console.log("Engine created.");
        }
        Engine.prototype.start = function () {
            this._canvas = LH.GLUtilities.initialize("pathTracer");
            LH.gl.clearColor(0, 0, 0, 1);
            this.loadShaders();
            this._shader.use();
            this.createBuffer();
            this.tick();
        };
        Engine.prototype.resize = function () {
            if (this._canvas !== undefined) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
                LH.gl.viewport(0, 0, this._canvas.width, this._canvas.height);
            }
        };
        Engine.prototype.tick = function () {
            this._frameCount++;
            LH.gl.clear(LH.gl.COLOR_BUFFER_BIT);
            var colorPosition = this._shader.getUniformLocation("u_color");
            LH.gl.uniform4f(colorPosition, 1, 0.5, 0, 1);
            this._buffer.bind();
            this._buffer.draw();
            requestAnimationFrame(this.tick.bind(this));
        };
        Engine.prototype.createBuffer = function () {
            this._buffer = new LH.GLBuffer(3);
            var positionAttribute = new LH.AttributeInformation();
            positionAttribute.location = this._shader.getAttributeLocation("a_position");
            positionAttribute.offset = 0;
            positionAttribute.size = 3;
            this._buffer.addAttributeLocation(positionAttribute);
            var vertices = [
                // x, y, z
                0, 0, 0,
                0, 0.5, 0,
                0.5, 0.5, 0
            ];
            this._buffer.pushBackData(vertices);
            this._buffer.upload();
            this._buffer.unbind();
        };
        Engine.prototype.loadShaders = function () {
            var vertexShaderSource = "\n                attribute vec3 a_position;\n                void main() {\n                    gl_Position = vec4(a_position, 1.0);\n                }\n            ";
            var fragmentShaderSource = "\n                precision mediump float;\n\n                uniform vec4 u_color;\n\n                void main() {\n                    gl_FragColor = u_color;\n                }\n            ";
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
    var AttributeInformation = /** @class */ (function () {
        function AttributeInformation() {
        }
        return AttributeInformation;
    }());
    LH.AttributeInformation = AttributeInformation;
    var GLBuffer = /** @class */ (function () {
        /**
         * Creates a new GL buffer.
         * @param dataType The data type of this buffer. Default: gl.FLOAT
         * @param targetBufferType The buffer target type. Can be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER. Default: gl.ARRAY_BUFFER
         * @param mode The drawing mode of this buffer. (i.e. gl.TRIANGLES or gl.LINES). Default: gl.TRIANGLES
         */
        function GLBuffer(elementSize, dataType, targetBufferType, mode) {
            if (dataType === void 0) { dataType = LH.gl.FLOAT; }
            if (targetBufferType === void 0) { targetBufferType = LH.gl.ARRAY_BUFFER; }
            if (mode === void 0) { mode = LH.gl.TRIANGLES; }
            this._hasAttributeLocation = false;
            this._data = [];
            this._attributes = [];
            this._elementSize = elementSize;
            this._dataType = dataType;
            this._tagertBufferType = targetBufferType;
            this._mode = mode;
            switch (this._dataType) {
                case LH.gl.FLOAT:
                case LH.gl.INT:
                case LH.gl.UNSIGNED_INT:
                    this._dataTypeSize = 4;
                    break;
                case LH.gl.SHORT:
                case LH.gl.UNSIGNED_SHORT:
                    this._dataTypeSize = 2;
                    break;
                case LH.gl.BYTE:
                case LH.gl.UNSIGNED_BYTE:
                    this._dataTypeSize = 1;
                    break;
                default:
                    throw new Error("Unrecognized data type '" + dataType.toString() + "'");
            }
            this._stride = this._elementSize * this._dataTypeSize;
            this._buffer = LH.gl.createBuffer();
        }
        GLBuffer.prototype.destroy = function () {
            LH.gl.deleteBuffer(this._buffer);
        };
        GLBuffer.prototype.bind = function (isNormalized) {
            if (isNormalized === void 0) { isNormalized = false; }
            LH.gl.bindBuffer(this._tagertBufferType, this._buffer);
            if (this._hasAttributeLocation) {
                for (var _i = 0, _a = this._attributes; _i < _a.length; _i++) {
                    var attribute = _a[_i];
                    LH.gl.vertexAttribPointer(attribute.location, attribute.size, this._dataType, isNormalized, this._stride, attribute.offset * this._dataTypeSize);
                    LH.gl.enableVertexAttribArray(attribute.location);
                }
            }
        };
        GLBuffer.prototype.unbind = function () {
            LH.gl.bindBuffer(this._tagertBufferType, undefined);
            for (var _i = 0, _a = this._attributes; _i < _a.length; _i++) {
                var attribute = _a[_i];
                LH.gl.disableVertexAttribArray(attribute.location);
            }
        };
        GLBuffer.prototype.addAttributeLocation = function (attributeInformation) {
            this._hasAttributeLocation = true;
            this._attributes.push(attributeInformation);
        };
        GLBuffer.prototype.pushBackData = function (data) {
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var element = data_1[_i];
                this._data.push(element);
            }
        };
        /**
         * Upload buffer data to the GPU
         */
        GLBuffer.prototype.upload = function () {
            LH.gl.bindBuffer(this._tagertBufferType, this._buffer);
            var bufferData;
            switch (this._dataType) {
                case LH.gl.FLOAT:
                    bufferData = new Float32Array(this._data);
                    break;
                case LH.gl.INT:
                    bufferData = new Int32Array(this._data);
                    break;
                case LH.gl.UNSIGNED_INT:
                    bufferData = new Uint32Array(this._data);
                    break;
                case LH.gl.SHORT:
                    bufferData = new Int16Array(this._data);
                    break;
                case LH.gl.UNSIGNED_SHORT:
                    bufferData = new Uint16Array(this._data);
                    break;
                case LH.gl.BYTE:
                    bufferData = new Int8Array(this._data);
                    break;
                case LH.gl.UNSIGNED_BYTE:
                    bufferData = new Uint8Array(this._data);
                    break;
            }
            LH.gl.bufferData(this._tagertBufferType, bufferData, LH.gl.STATIC_DRAW);
        };
        GLBuffer.prototype.draw = function () {
            if (this._tagertBufferType == LH.gl.ARRAY_BUFFER) {
                LH.gl.drawArrays(this._mode, 0, this._data.length / this._elementSize);
            }
            else if (this._tagertBufferType == LH.gl.ELEMENT_ARRAY_BUFFER) {
                LH.gl.drawElements(this._mode, this._data.length, this._dataType, 0);
            }
        };
        return GLBuffer;
    }());
    LH.GLBuffer = GLBuffer;
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
var LH;
(function (LH) {
    var Shader = /** @class */ (function () {
        function Shader(name, vertexSource, fragmentSource) {
            this._attributes = {};
            this._uniforms = {};
            this._name = name;
            var vertexShader = this.loadShader(vertexSource, LH.gl.VERTEX_SHADER);
            var fragmentShader = this.loadShader(fragmentSource, LH.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
            this.detectAttributes();
            this.detectUniforms();
        }
        Object.defineProperty(Shader.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Shader.prototype.getAttributeLocation = function (name) {
            if (this._attributes[name] === undefined) {
                throw new Error("Unable to find attribute '" + name + "' in shader '" + this._name + "'");
            }
            return this._attributes[name];
        };
        Shader.prototype.getUniformLocation = function (name) {
            if (this._uniforms[name] === undefined) {
                throw new Error("Unable to find uniform '" + name + "' in shader '" + this._name + "'");
            }
            return this._uniforms[name];
        };
        Shader.prototype.use = function () {
            LH.gl.useProgram(this._program);
        };
        Shader.prototype.loadShader = function (source, shaderType) {
            var shader = LH.gl.createShader(shaderType);
            LH.gl.shaderSource(shader, source);
            LH.gl.compileShader(shader);
            var shaderInfoLog = LH.gl.getShaderInfoLog(shader);
            if (shaderInfoLog !== "") {
                throw new Error("Error compiling shader '" + this._name + "': '" + shaderInfoLog + "'");
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
                throw new Error("Error linking shader '" + this._name + "': " + programInfoLog + "'");
            }
        };
        Shader.prototype.detectAttributes = function () {
            var attributeCount = LH.gl.getProgramParameter(this._program, LH.gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < attributeCount; i++) {
                var attribute = LH.gl.getActiveAttrib(this._program, i);
                if (!attribute) {
                    break;
                }
                this._attributes[attribute.name] = LH.gl.getAttribLocation(this._program, attribute.name);
            }
        };
        Shader.prototype.detectUniforms = function () {
            var uniformCount = LH.gl.getProgramParameter(this._program, LH.gl.ACTIVE_UNIFORMS);
            for (var i = 0; i < uniformCount; i++) {
                var uniform = LH.gl.getActiveUniform(this._program, i);
                if (!uniform) {
                    break;
                }
                this._uniforms[uniform.name] = LH.gl.getUniformLocation(this._program, uniform.name);
            }
        };
        return Shader;
    }());
    LH.Shader = Shader;
})(LH || (LH = {}));
