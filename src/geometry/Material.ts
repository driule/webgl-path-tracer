import { vec3 } from "gl-matrix";
import { Texture } from "./Texture";

export class Material {

    private id: number;

    // base color
    private color: vec3;

    // albedo texture: data as flat rgba list {r, g, b, a, r, g, b, a, ... }
    private albedoTexture: Texture;
    private hasAlpha: boolean;

    // TODO:
    // [-] support alpha
    // [-] normal texture
    // [-] roughness
    // [-] specularity

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

    public setAlbedoTexture(albedoTexture: Texture, hasAlpha: boolean = false): void {
        this.albedoTexture = albedoTexture;
        this.hasAlpha = hasAlpha;
    }

    public getalbedoTexture(): Texture {
        return this.albedoTexture;
    }

    public hasAlphaChannel(): boolean {
        return this.hasAlpha;
    }
}