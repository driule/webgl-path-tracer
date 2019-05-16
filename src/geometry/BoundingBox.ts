import { vec3 } from "gl-matrix";

export class BoundingBox {

    public min: vec3;
    public max: vec3;

    public isLeaf: boolean;
    public left: BoundingBox;
    public right: BoundingBox;
    public first: number;
    public count: number;
    
    private _id: number;
    private _center: vec3;

    public constructor(id: number) {
        this._id = id;
    }

    public get id(): number {
        return this._id;
    }

    public get center(): any {
        return this._center;
    }

    public calculateSurfaceArea(): number
    {
        let diagonal: vec3 = vec3.subtract(vec3.create(), this.max, this.min);
        diagonal = vec3.fromValues(Math.abs(diagonal[0]), Math.abs(diagonal[1]), Math.abs(diagonal[2]));

        return ((diagonal[0] * diagonal[1]) + (diagonal[0] * diagonal[2]) + (diagonal[2] * diagonal[1])) * 2;
    }

    public calculateCenter(): void {
        this._center = vec3.add(vec3.create(), this.min, vec3.scale(vec3.create(), vec3.subtract(vec3.create(), this.max, this.min), 0.5));
    }
}