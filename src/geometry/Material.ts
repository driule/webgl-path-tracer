import { vec3 } from "gl-matrix";

export class Material {

    private color: vec3;
    private albedoTexture: HTMLImageElement;

    public constructor() {

    }

    public getColor(): vec3 {
        return this.color;
    }

    public getAlbedoTexture(): HTMLImageElement {
        return this.albedoTexture;
    }
}