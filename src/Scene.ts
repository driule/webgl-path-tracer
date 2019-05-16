import { Camera } from "./Camera";
import { Light } from "./geometry/Light";
import { Triangle } from "./geometry/Triangle";
import { BVH } from "./geometry/BVH";

import { vec3 } from "gl-matrix";

const duckModel = require('./assets/models/duck/Duck.gltf');

export class Scene {

    private _camera: Camera;

    private _triangles: Triangle[];
    private _lights: Light[];
    
    private _bvh: BVH;

    public constructor(camera: Camera) {
        this._camera = camera;
        this._bvh = new BVH();

        this._triangles = [];
        this._lights = [];
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
        this._bvh.build(this._triangles);
    }

    private loadGLTF(filePath: string): void {
        // let gltfLoader = new GLTFLoader()
        // gltfLoader.parse(duckModel);
        let x = duckModel;
    }

    private loadFile(filePath: string): string {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", filePath, false);
        xmlhttp.send(null);
    
        return xmlhttp.responseText;
    }

    public loadModel(filePath: string, translation: number[] = [0, 0, 0]): void {
        let triangles: Triangle[] = [];

        let lines = this.loadFile(filePath).split('\n')

        let vertices = [];
        let faceIndexes = [];
        let meshVertices = [];

        // collect vertices and facets data
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].replace(/(\r\n|\n|\r)/gm, "");
            let parts = line.split(" ");
            parts = parts.filter(v => v != '' && v != ' ');

            if (parts[0] === "v") {
                vertices.push([+parts[1], +parts[2], +parts[3]]);
            } else if (parts[0] === "f") {

                // triangle
                if (parts.length == 4) {
                    for (let j = 1; j < 4; j++) {
                        let v_vt_vn = parts[j].split("/");
                        faceIndexes.push((+v_vt_vn[0]) - 1);
                    }
                }  else if (parts.length > 4) {
                    let v_vt_vn: any;
                    
                    v_vt_vn = parts[1].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[2].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[3].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);

                    v_vt_vn = parts[1].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[3].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                    v_vt_vn = parts[4].split("/");
                    faceIndexes.push((+v_vt_vn[0]) - 1);
                }

                // faceIndexes.push((+parts[1]) - 1);
                // faceIndexes.push((+parts[2]) - 1);
                // faceIndexes.push((+parts[3]) - 1);
            }
        }

        // build all mesh vertices
        for (let i = 0; i < faceIndexes.length; i++) {
            meshVertices.push([
                vertices[faceIndexes[i]][0],
                vertices[faceIndexes[i]][1],
                vertices[faceIndexes[i]][2]
            ]);
        }

        for (let i = 0; i < meshVertices.length / 3; i++) {
            let a: vec3 = vec3.add(vec3.create(), meshVertices[i * 3], translation);
            let b: vec3 = vec3.add(vec3.create(), meshVertices[i * 3 + 1], translation);
            let c: vec3 = vec3.add(vec3.create(), meshVertices[i * 3 + 2], translation);

            triangles.push(new Triangle(a, b, c));
        }

        this._triangles = this._triangles.concat(triangles);
        this._bvh.build(this._triangles);
    }
}
