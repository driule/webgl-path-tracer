export class Texture {

    private data: Float32Array;

    private width: number;
    private height: number;

    public constructor(data: Float32Array, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
    }

    public getData(): Float32Array {
        return this.data;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }
}