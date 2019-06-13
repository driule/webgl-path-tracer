import { vec3 } from "gl-matrix";

export class Material {

    private id: number;

    private color: vec3;
    private albedoTexture: HTMLImageElement;
    private rgbList: Float32Array;

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

public getAlbedoTexture(): [HTMLImageElement, Float32Array] {
        return [this.albedoTexture, this.rgbList];
    }

    public setAlbedoTexture(albedoTexture: HTMLImageElement, rgbList: Float32Array): void {
        this.albedoTexture = albedoTexture;
        this.rgbList = rgbList;
    }
}