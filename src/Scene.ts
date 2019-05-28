import { Camera } from "./Camera";
import { Light } from "./geometry/Light";
import { Triangle } from "./geometry/Triangle";
import { BVH } from "./geometry/BVH";
import { Material } from "./geometry/Material";

export class Scene {

    private _camera: Camera;

    private _triangles: Triangle[];
    private _materials: Material[];
    private _lights: Light[];
    
    private _bvh: BVH;

    public skydome: any;

    public constructor(camera: Camera) {
        this._camera = camera;

        this._triangles = [];
        this._materials = [];
        this._lights = [];
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get triangles(): Triangle[] {
        return this._triangles;
    }

    public get materials(): Material[] {
        return this._materials;
    }

    public get lights(): Light[] {
        return this._lights;
    }

    public get bvh(): BVH {
        return this._bvh;
    }

    public setLights(lights: Light[] = []): void {
        this._lights = lights;
    }

    public setTriangles(triangles: Triangle[] = []): void {
        this._triangles = triangles;
        this._bvh = new BVH(this._triangles);
    }

    public addTriangles(triangles: Triangle[] = []): void {
        this._triangles = this._triangles.concat(triangles);
        this._bvh = new BVH(this._triangles);
    }

    public setMaterials(materials: Material[] = []): void {
        this._materials = materials;
    }

    public addMaterials(materials: Material[] = []): void {
        this._materials = this._materials.concat(materials);
    }
}
