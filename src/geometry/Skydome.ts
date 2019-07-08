export class Skydome {

    private data: number[]; // flat rgba list {r, g, b, a, r, g, b, a, ... }

    private width: number;
    private height: number;

    public constructor(data: number[], width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
    }

    public getData(): number[] {
        return this.data;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }
}