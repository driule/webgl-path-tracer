namespace LH {

    export class Scene {

        private _camera: Camera;
        private _triangles: Triangle[];
        private _lights: Light[];
        private _bvh: BVH;

        public constructor(camera: Camera) {
            this._camera = camera;
            this._bvh = new BVH();
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

        public setGeometry(triangles: Triangle[], lights: Light[]): void {
            this._triangles = triangles;
            this._lights = lights;

            // rebuild BVH is scene has changed
            this._bvh.build(this._triangles);
        }
    }
}