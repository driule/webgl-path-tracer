import { Camera } from "./Camera";
import { Light } from "./geometry/Light";
import { Triangle } from "./geometry/Triangle";
import { BVH } from "./geometry/BVH";

export class Scene {

    private _camera: Camera;

    private _triangles: Triangle[];
    private _lights: Light[];
    
    private _bvh: BVH;

    public textureImage: HTMLImageElement;
    public skydome: any;

    public constructor(camera: Camera) {
        this._camera = camera;

        this._triangles = [];
        this._lights = [];

        // ToDo: check
        this.textureImage = undefined;
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get triangles(): Triangle[] {
        return this._triangles;
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
}
