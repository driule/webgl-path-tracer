namespace LH {

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

        public loadModel(filePath: string, translation: number[] = [0, 0, 0]): void {
            let triangles: Triangle[] = [];

            let lines = loadFile(filePath).split('\n')

            let vertices = [];
            let faceIndexes = [];
            let meshVertices = [];

            // collect vertices and facets data
            for (let i = 0; i < lines.length; i++) {
                let parts = lines[i].split(" ");

                if (parts[0] === "v") {
                    vertices.push([+parts[1], +parts[2], +parts[3]]);
                } else if (parts[0] === "f") {
                    faceIndexes.push((+parts[1]) - 1);
                    faceIndexes.push((+parts[2]) - 1);
                    faceIndexes.push((+parts[3]) - 1);
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
                let a = glMatrix.vec3.add([], meshVertices[i * 3], translation);
                let b = glMatrix.vec3.add([], meshVertices[i * 3 + 1], translation);
                let c = glMatrix.vec3.add([], meshVertices[i * 3 + 2], translation);

                triangles.push(new Triangle(a, b, c));
            }

            this._triangles = this._triangles.concat(triangles);
            this._bvh.build(this._triangles);
        }
    }
}