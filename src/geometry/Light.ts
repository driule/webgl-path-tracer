import { vec3 } from "gl-matrix";

export class Light {

    private _position: vec3;
    private _radius: number;
    private _intensity: number;

    public constructor(position: vec3, radius: number, intensity: number) {
        this._position = position;
        this._radius = radius;
        this._intensity = intensity;
    }

    public get position(): vec3 {
        return this._position;
    }

    public get radius(): number {
        return this._radius;
    }

    public get intensity(): number {
        return this._intensity;
    }
}