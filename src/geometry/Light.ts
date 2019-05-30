import { vec3 } from "gl-matrix";

export class Light {

    private position: vec3;
    private radius: number;
    private intensity: number;

    public constructor(position: vec3, radius: number, intensity: number) {
        this.position = position;
        this.radius = radius;
        this.intensity = intensity;
    }

    public getPosition(): vec3 {
        return this.position;
    }

    public getRadius(): number {
        return this.radius;
    }

    public getIntensity(): number {
        return this.intensity;
    }
}