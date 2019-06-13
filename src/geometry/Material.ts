import { vec3 } from "gl-matrix";

export class Material {

    private id: number;

    // base color
    private color: vec3;

    // albedo
    private albedoImageElement: HTMLImageElement;
    private albedoImageData: Float32Array;

    public constructor(id: number, color: vec3 = vec3.fromValues(0.25, 0.25, 0.25)) {
        this.id = id;
        this.color = color;
    }

    public getId(): number {
        return this.id;
    }

    public getColor(): vec3 {
        return this.color;
    }

    public setColor(color: vec3): void {
        this.color = color;
    }

    public getAlbedoImageElement(): HTMLImageElement {
        return this.albedoImageElement;
    }

    public getAlbedoImageData(): Float32Array {
        return this.albedoImageData
    }

    public setAlbedoImageElement(albedoImageElement: HTMLImageElement): void {
        this.albedoImageElement = albedoImageElement;
    }

    public setAlbedoImageData(albedoImageData: Float32Array): void {
        this.albedoImageData = albedoImageData;
    }
}