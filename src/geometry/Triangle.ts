import { BoundingBox } from "./BoundingBox";
import { vec3 } from "gl-matrix";

export class Triangle {

    private _a: vec3;
    private _b: vec3;
    private _c: vec3;

    private _boundingBox: BoundingBox;

    public constructor(a: vec3, b: vec3, c: vec3) {
        this._a = a;
        this._b = b;
        this._c = c;

        let minX: number = Math.min(this._a[0], this._b[0], this._c[0]);
        let minY: number = Math.min(this._a[1], this._b[1], this._c[1]);
        let minZ: number = Math.min(this._a[2], this._b[2], this._c[2]);

        let maxX: number = Math.max(this._a[0], this._b[0], this._c[0]);
        let maxY: number = Math.max(this._a[1], this._b[1], this._c[1]);
        let maxZ: number = Math.max(this._a[2], this._b[2], this._c[2]);
    
        this._boundingBox = new BoundingBox(0);
        this._boundingBox.min = vec3.fromValues(minX, minY, minZ);
        this._boundingBox.max = vec3.fromValues(maxX, maxY, maxZ);
        this._boundingBox.calculateCenter();
    }

    public get a(): vec3 {
        return this._a;
    }

    public get b(): vec3 {
        return this._b;
    }

    public get c(): vec3 {
        return this._c;
    }

    public get boundingBox(): BoundingBox {
        return this._boundingBox;
    }
}