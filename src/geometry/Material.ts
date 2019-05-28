import { vec3 } from "gl-matrix";

export class Material {

    private id: number;

    private color: vec3;
    private albedoTexture: HTMLImageElement;

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

    public getAlbedoTexture(): HTMLImageElement {
        return this.albedoTexture;
    }

    public setAlbedoTexture(albedoTexture: HTMLImageElement): void {
        this.albedoTexture = albedoTexture;
    }
}