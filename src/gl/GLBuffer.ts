import { gl } from "./GLUtilities";

export class AttributeInformation {
    public location: number;
    public size: number; // number of elements in the attribute (i.e. Vector3 = 3)
    public offset: number;
}

export class GLBuffer {

    private hasAttributeLocation: boolean = false;
    private elementSize: number; // the size of each element in the buffer
    private stride: number; // the data type of the buffer
    private _buffer: WebGLBuffer; 

    private bufferType: number; // the buffer target type. Can be either gl.ARRAY_BUFFER or gl.ELEMENT_ARRAY_BUFFER
    private dataType: number;
    private dataTypeSize: number;
    private mode: number; // the drawing mode of this buffer. (i.e. gl.TRIANGLES or gl.LINES)

    private data: number[] = [];
    private attributes: AttributeInformation[] = [];

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
        this.elementSize = elementSize;
        this.dataType = dataType;
        this.bufferType = bufferType;
        this.mode = mode;

        switch (this.dataType) {
            case gl.FLOAT:
            case gl.INT:
            case gl.UNSIGNED_INT:
                this.dataTypeSize = 4;
                break;
            case gl.SHORT:
            case gl.UNSIGNED_SHORT:
                this.dataTypeSize = 2;
                break;
            case gl.BYTE:
            case gl.UNSIGNED_BYTE:
                this.dataTypeSize = 1;
                break;
            default:
                throw new Error(`Unrecognized data type '${dataType.toString()}'`);
        }

        this.stride = this.elementSize * this.dataTypeSize;
        this._buffer = gl.createBuffer();
    }

    public destroy(): void {
        gl.deleteBuffer(this._buffer);
    }

    public bind(isNormalized: boolean = false): void {
        gl.bindBuffer(this.bufferType, this._buffer);

        if (this.hasAttributeLocation) {
            for (let attribute of this.attributes) {
                gl.vertexAttribPointer(
                    attribute.location,
                    attribute.size,
                    this.dataType,
                    isNormalized,
                    this.stride,
                    attribute.offset * this.dataTypeSize
                );
                gl.enableVertexAttribArray(attribute.location);
            }
        }
    }

    public unbind(): void {
        gl.bindBuffer(this.bufferType, undefined);

        for (let attribute of this.attributes) {
            gl.disableVertexAttribArray(attribute.location);
        }
    }

    public addAttributeLocation(attributeInformation: AttributeInformation): void {
        this.hasAttributeLocation = true;
        this.attributes.push(attributeInformation);
    }

    public pushBackData(data: number[]): void {
        for (let element of data) {
            this.data.push(element);
        }
    }

    /**
     * Upload buffer data to the GPU
     */
    public upload(): void {
        gl.bindBuffer(this.bufferType, this._buffer);

        let bufferData: ArrayBuffer;

        switch(this.dataType) {
            case gl.FLOAT:
                bufferData = new Float32Array(this.data);
                break;
            case gl.INT:
                bufferData = new Int32Array(this.data);
                break;
            case gl.UNSIGNED_INT:
                bufferData = new Uint32Array(this.data);
                break;
            case gl.SHORT:
                bufferData = new Int16Array(this.data);
                break;
            case gl.UNSIGNED_SHORT:
                bufferData = new Uint16Array(this.data);
                break;
            case gl.BYTE:
                bufferData = new Int8Array(this.data);
                break;
            case gl.UNSIGNED_BYTE:
                bufferData = new Uint8Array(this.data);
                break;
        }

        gl.bufferData(this.bufferType, bufferData, gl.STATIC_DRAW);
    }

    public draw(): void {
        this.bind();
        
        if (this.bufferType == gl.ARRAY_BUFFER) {
            gl.drawArrays(this.mode, 0, this.data.length / this.elementSize);
        } else if (this.bufferType == gl.ELEMENT_ARRAY_BUFFER) {
            gl.drawElements(this.mode, this.data.length, this.dataType, 0);
        }
    }
}
