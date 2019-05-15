"use strict";
// namespace LH {
Object.defineProperty(exports, "__esModule", { value: true });
var GLUtilities_1 = require("./GLUtilities");
var AttributeInformation = /** @class */ (function () {
    function AttributeInformation() {
    }
    return AttributeInformation;
}());
exports.AttributeInformation = AttributeInformation;
var GLBuffer = /** @class */ (function () {
    /**
     * Creates a new GL buffer.
     * @param dataType The data type of this buffer. Default: gl.FLOAT
     * @param bufferType The buffer target type. Can be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER. Default: gl.ARRAY_BUFFER
     * @param mode The drawing mode of this buffer. (i.e. gl.TRIANGLES or gl.LINES). Default: gl.TRIANGLES
     */
    function GLBuffer(elementSize, dataType, bufferType, mode) {
        if (dataType === void 0) { dataType = GLUtilities_1.gl.FLOAT; }
        if (bufferType === void 0) { bufferType = GLUtilities_1.gl.ARRAY_BUFFER; }
        if (mode === void 0) { mode = GLUtilities_1.gl.TRIANGLES; }
        this._hasAttributeLocation = false;
        this._data = [];
        this._attributes = [];
        this._elementSize = elementSize;
        this._dataType = dataType;
        this._bufferType = bufferType;
        this._mode = mode;
        switch (this._dataType) {
            case GLUtilities_1.gl.FLOAT:
            case GLUtilities_1.gl.INT:
            case GLUtilities_1.gl.UNSIGNED_INT:
                this._dataTypeSize = 4;
                break;
            case GLUtilities_1.gl.SHORT:
            case GLUtilities_1.gl.UNSIGNED_SHORT:
                this._dataTypeSize = 2;
                break;
            case GLUtilities_1.gl.BYTE:
            case GLUtilities_1.gl.UNSIGNED_BYTE:
                this._dataTypeSize = 1;
                break;
            default:
                throw new Error("Unrecognized data type '" + dataType.toString() + "'");
        }
        this._stride = this._elementSize * this._dataTypeSize;
        this._buffer = GLUtilities_1.gl.createBuffer();
    }
    GLBuffer.prototype.destroy = function () {
        GLUtilities_1.gl.deleteBuffer(this._buffer);
    };
    GLBuffer.prototype.bind = function (isNormalized) {
        if (isNormalized === void 0) { isNormalized = false; }
        GLUtilities_1.gl.bindBuffer(this._bufferType, this._buffer);
        if (this._hasAttributeLocation) {
            for (var _i = 0, _a = this._attributes; _i < _a.length; _i++) {
                var attribute = _a[_i];
                GLUtilities_1.gl.vertexAttribPointer(attribute.location, attribute.size, this._dataType, isNormalized, this._stride, attribute.offset * this._dataTypeSize);
                GLUtilities_1.gl.enableVertexAttribArray(attribute.location);
            }
        }
    };
    GLBuffer.prototype.unbind = function () {
        GLUtilities_1.gl.bindBuffer(this._bufferType, undefined);
        for (var _i = 0, _a = this._attributes; _i < _a.length; _i++) {
            var attribute = _a[_i];
            GLUtilities_1.gl.disableVertexAttribArray(attribute.location);
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
        GLUtilities_1.gl.bindBuffer(this._bufferType, this._buffer);
        var bufferData;
        switch (this._dataType) {
            case GLUtilities_1.gl.FLOAT:
                bufferData = new Float32Array(this._data);
                break;
            case GLUtilities_1.gl.INT:
                bufferData = new Int32Array(this._data);
                break;
            case GLUtilities_1.gl.UNSIGNED_INT:
                bufferData = new Uint32Array(this._data);
                break;
            case GLUtilities_1.gl.SHORT:
                bufferData = new Int16Array(this._data);
                break;
            case GLUtilities_1.gl.UNSIGNED_SHORT:
                bufferData = new Uint16Array(this._data);
                break;
            case GLUtilities_1.gl.BYTE:
                bufferData = new Int8Array(this._data);
                break;
            case GLUtilities_1.gl.UNSIGNED_BYTE:
                bufferData = new Uint8Array(this._data);
                break;
        }
        GLUtilities_1.gl.bufferData(this._bufferType, bufferData, GLUtilities_1.gl.STATIC_DRAW);
    };
    GLBuffer.prototype.draw = function () {
        this.bind();
        if (this._bufferType == GLUtilities_1.gl.ARRAY_BUFFER) {
            GLUtilities_1.gl.drawArrays(this._mode, 0, this._data.length / this._elementSize);
        }
        else if (this._bufferType == GLUtilities_1.gl.ELEMENT_ARRAY_BUFFER) {
            GLUtilities_1.gl.drawElements(this._mode, this._data.length, this._dataType, 0);
        }
    };
    return GLBuffer;
}());
exports.GLBuffer = GLBuffer;
// }
//# sourceMappingURL=GLBuffer.js.map