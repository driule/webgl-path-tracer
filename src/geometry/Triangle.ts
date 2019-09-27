import { BoundingBox } from "./BoundingBox";

import { vec3, vec2 } from "gl-matrix";
import { Material } from "./Material";

export class Triangle {

    private a: vec3;
    private b: vec3;
    private c: vec3;

    private normal: vec3;

    private uvA: vec2;
    private uvB: vec2;
    private uvC: vec2;

    private material: Material;
    private boundingBox: BoundingBox;

    public constructor(
        a: vec3,
        b: vec3,
        c: vec3,
        material: Material,
        uvA: vec2 = vec2.fromValues(0.0, 0.0),
        uvB: vec2 = vec2.fromValues(0.0, 0.0),
        uvC: vec2 = vec2.fromValues(0.0, 0.0)
    ) {
        this.a = a;
        this.b = b;
        this.c = c;

        this.normal = vec3.normalize(
            vec3.create(),
            vec3.cross(
                vec3.create(),
                vec3.sub(vec3.create(), this.a, this.b),
                vec3.sub(vec3.create(), this.b, this.c)
            )
        );

        this.material = material;

        this.uvA = uvA;
        this.uvB = uvB;
        this.uvC = uvC;

        let minX: number = Math.min(this.a[0], this.b[0], this.c[0]);
        let minY: number = Math.min(this.a[1], this.b[1], this.c[1]);
        let minZ: number = Math.min(this.a[2], this.b[2], this.c[2]);

        let maxX: number = Math.max(this.a[0], this.b[0], this.c[0]);
        let maxY: number = Math.max(this.a[1], this.b[1], this.c[1]);
        let maxZ: number = Math.max(this.a[2], this.b[2], this.c[2]);
    
        this.boundingBox = new BoundingBox(0);
        this.boundingBox.min = vec3.fromValues(minX, minY, minZ);
        this.boundingBox.max = vec3.fromValues(maxX, maxY, maxZ);
        this.boundingBox.calculateCenter();
    }

    public getA(): vec3 {
        return this.a;
    }

    public getB(): vec3 {
        return this.b;
    }

    public getC(): vec3 {
        return this.c;
    }

    public getNormal(): vec3 {
        return this.normal;
    }

    public getUvA(): vec2 {
        return this.uvA;
    }

    public getUvB(): vec2 {
        return this.uvB;
    }

    public getUvC(): vec2 {
        return this.uvC;
    }

    public getMaterial(): Material {
        return this.material;
    }

    public getBoundingBox(): BoundingBox {
        return this.boundingBox;
    }

    public setUvA(uvA: vec2): void {
        this.uvA = uvA;
    }

    public setUvB(uvB: vec2): void {
        this.uvB = uvB;
    }

    public setUvC(uvC: vec2): void {
        this.uvC = uvC;
    }
}