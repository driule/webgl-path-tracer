// namespace LH {

    import { gl } from "./GLUtilities";

    export class AttributeInformation {
        public location: number;
        public size: number; // number of elements in the attribute (i.e. Vector3 = 3)
        public offset: number;
    }

    export class GLBuffer {

        private _hasAttributeLocation: boolean = false;
        private _elementSize: number; // the size of each element in the buffer
        private _stride: number; // the data type of the buffer
        private _buffer: WebGLBuffer; 

        private _bufferType: number; // the buffer target type. Can be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER
        private _dataType: number;
        private _dataTypeSize: number;
        private _mode: number; // the drawing mode of this buffer. (i.e. gl.TRIANGLES or gl.LINES)

        private _data: number[] = [];
        private _attributes: AttributeInformation[] = [];

        /**
         * Creates a new GL buffer.
         * @param dataType The data type of this buffer. Default: gl.FLOAT
         * @param bufferType The buffer target type. Can be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER. Default: gl.ARRAY_BUFFER
         * @param mode The drawing mode of this buffer. (i.e. gl.TRIANGLES or gl.LINES). Default: gl.TRIANGLES
         */
        public constructor(
            elementSize: number,
            dataType: number = gl.FLOAT,
            bufferType: number = gl.ARRAY_BUFFER,
            mode: number = gl.TRIANGLES
        ) {
            this._elementSize = elementSize;
            this._dataType = dataType;
            this._bufferType = bufferType;
            this._mode = mode;

            switch (this._dataType) {
                case gl.FLOAT:
                case gl.INT:
                case gl.UNSIGNED_INT:
                    this._dataTypeSize = 4;
                    break;
                case gl.SHORT:
                case gl.UNSIGNED_SHORT:
                    this._dataTypeSize = 2;
                    break;
                case gl.BYTE:
                case gl.UNSIGNED_BYTE:
                    this._dataTypeSize = 1;
                    break;
                default:
                    throw new Error(`Unrecognized data type '${dataType.toString()}'`);
            }

            this._stride = this._elementSize * this._dataTypeSize;
            this._buffer = gl.createBuffer();
        }

        public destroy(): void {
            gl.deleteBuffer(this._buffer);
        }

        public bind(isNormalized: boolean = false): void {
            gl.bindBuffer(this._bufferType, this._buffer);

            if (this._hasAttributeLocation) {
                for (let attribute of this._attributes) {
                    gl.vertexAttribPointer(
                        attribute.location,
                        attribute.size,
                        this._dataType,
                        isNormalized,
                        this._stride,
                        attribute.offset * this._dataTypeSize
                    );
                    gl.enableVertexAttribArray(attribute.location);
                }
            }
        }

        public unbind(): void {
            gl.bindBuffer(this._bufferType, undefined);

            for (let attribute of this._attributes) {
                gl.disableVertexAttribArray(attribute.location);
            }
        }

        public addAttributeLocation(attributeInformation: AttributeInformation): void {
            this._hasAttributeLocation = true;
            this._attributes.push(attributeInformation);
        }

        public pushBackData(data: number[]): void {
            for (let element of data) {
                this._data.push(element);
            }
        }

        /**
         * Upload buffer data to the GPU
         */
        public upload(): void {
            gl.bindBuffer(this._bufferType, this._buffer);

            let bufferData: ArrayBuffer;

            switch(this._dataType) {
                case gl.FLOAT:
                    bufferData = new Float32Array(this._data);
                    break;
                case gl.INT:
                    bufferData = new Int32Array(this._data);
                    break;
                case gl.UNSIGNED_INT:
                    bufferData = new Uint32Array(this._data);
                    break;
                case gl.SHORT:
                    bufferData = new Int16Array(this._data);
                    break;
                case gl.UNSIGNED_SHORT:
                    bufferData = new Uint16Array(this._data);
                    break;
                case gl.BYTE:
                    bufferData = new Int8Array(this._data);
                    break;
                case gl.UNSIGNED_BYTE:
                    bufferData = new Uint8Array(this._data);
                    break;
            }

            gl.bufferData(this._bufferType, bufferData, gl.STATIC_DRAW);
        }

        public draw(): void {
            this.bind();
            
            if (this._bufferType == gl.ARRAY_BUFFER) {
                gl.drawArrays(this._mode, 0, this._data.length / this._elementSize);
            } else if (this._bufferType == gl.ELEMENT_ARRAY_BUFFER) {
                gl.drawElements(this._mode, this._data.length, this._dataType, 0);
            }
        }
    }
// }