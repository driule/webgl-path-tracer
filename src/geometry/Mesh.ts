import { Material } from "./Material";

export class Mesh {

    // defines starting and ending indices in the global triangle list
    // inclusive
    private startId: number;
    private endId: number;

    private material: Material;

    public constructor(startId: number, endId: number) {
        this.startId = startId;
        this.endId = endId;
    }

    public getMaterial(): Material {
        return this.material;
    }

    public getStartId(): number {
        return this.startId;
    }

    public getEndId(): number {
        return this.endId;
    }
}