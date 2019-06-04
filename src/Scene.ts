import { Camera } from "./Camera";
import { Light } from "./geometry/Light";
import { Triangle } from "./geometry/Triangle";
import { BVH } from "./geometry/BVH";
import { Material } from "./geometry/Material";

export class Scene {

    private camera: Camera;

    private triangles: Triangle[];
    private materials: Material[];
    private lights: Light[];
    
    private bvh: BVH;

    // object { shape[2], data }
    public skydome: any;

    public constructor(camera: Camera) {
        this.camera = camera;

        this.triangles = [];
        this.materials = [];
        this.lights = [];
    }

    public getCamera(): Camera {
        return this.camera;
    }

    public getTriangles(): Triangle[] {
        return this.triangles;
    }

    public getMaterials(): Material[] {
        return this.materials;
    }

    public getLights(): Light[] {
        return this.lights;
    }

    public getBVH(): BVH {
        return this.bvh;
    }

    public setLights(lights: Light[] = []): void {
        this.lights = lights;
    }

    public setTriangles(triangles: Triangle[] = []): void {
        this.triangles = triangles;
        this.bvh = new BVH(this.triangles);
    }

    public addTriangles(triangles: Triangle[] = []): void {
        this.triangles = this.triangles.concat(triangles);
        this.bvh = new BVH(this.triangles);
    }

    public setMaterials(materials: Material[] = []): void {
        this.materials = materials;
    }

    public addMaterials(materials: Material[] = []): void {
        this.materials = this.materials.concat(materials);
    }
}
