namespace LH {

    export class Renderer {

        private _canvas: HTMLCanvasElement;

        private _pathTracer: PathTracer;
        private _camera: Camera;

        private _isRendering: boolean;

        public constructor() {
            this._canvas = GLUtilities.initialize('pathTracer');
            this._camera = new Camera(this._canvas);
            this._pathTracer = new PathTracer(this._camera, [this._canvas.width, this._canvas.height]);
        }

        public start(): void {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // create scene
            // let triangles = this.createTriangles();
            let triangles = this.loadObject('assets/teddy.obj');

            let bvh: BVH = new BVH();
            bvh.build(triangles);

            let lights: Light[] = [
                new Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new Light([20.25, 22.75, 0.25], 1.5, 10.0),
                new Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];
            this._pathTracer.setObjects(triangles, lights, bvh);
            this._isRendering = true;

            primitiveCount = triangles.length;

            //var startTime = Date.now();
            //this.tick((Date.now() - startTime) * 0.001);
        }

        public tick(timeSinceStart: number): void {
            this._pathTracer.update(timeSinceStart);
            this._pathTracer.render();

            // fps measurement
            var currentTick = new Date().getTime();
            frameCount++;
            elapsedTime += (currentTick - lastTick);
            lastTick = currentTick;
            if (elapsedTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                elapsedTime -= 1000;
            }

            if (this._isRendering) {
                requestAnimationFrame(this.tick.bind(this));
            }
        }

        public pause(): void {
            this._isRendering = false;
        }

        public resume(): void {
            this._isRendering = true;
        }

        //
        // camera controls
        //
        public moveUp(): void {
            this._camera.moveUp();
            this.restart();
        }

        public moveDown(): void {
            this._camera.moveDown();
            this.restart();
        }

        public moveRight(): void {
            this._camera.moveRight();
            this.restart();
        }

        public moveLeft(): void {
            this._camera.moveLeft();
            this.restart();
        }

        public zoomIn(): void {
            this._camera.zoomIn();
            this.restart();
        }

        public zoomOut(): void {
            this._camera.zoomOut();
            this.restart();
        }
        
        public rotateUp(): void {
            this._camera.rotateUp();
            this.restart();
        }

        public rotateDown(): void {
            this._camera.rotateDown();
            this.restart();
        }

        public rotateRight(): void {
            this._camera.rotateRight();
            this.restart();
        }

        public rotateLeft(): void {
            this._camera.rotateLeft();
            this.restart();
        }

        private restart(): void {
            this._pathTracer.restart();
            this._camera.calculateViewProjection();
        }
        
        //
        // scene objects
        //
        private createTriangles(): Triangle[] {
            let objects = [];

            // for (let i = 0; i < 30; i++) {
            //     // ground plane
            //     objects.push(new Triangle([-0.75 + i - 3, -0.95, -0.75], [0.75 + i - 3, -0.95, 0.75], [0.75 + i - 3, -0.95, -0.75]));
            //     objects.push(new Triangle([-0.75 + i - 3, -0.95, -0.75], [-0.75+ i - 3, -0.95, 0.75], [0.75 + i - 3, -0.95, 0.75]));
                
            //     // left side
            //     //objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]));
            //     //objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75],  [-0.75, 0.95, 0.75]));

            //     // back side
            //     objects.push(new Triangle([-0.75 + i - 3, -0.95, -0.75], [0.75 + i - 3, -0.95, -0.75], [-0.75 + i - 3, 0.95, -0.75]));
            //     objects.push(new Triangle([0.75 + i - 3, -0.95, -0.75], [0.75 + i - 3, 0.95, -0.75], [-0.75 + i - 3, 0.95, -0.75]));
            // }

            // ground plane
            // objects.push(new Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, 0.75], [0.75, -0.95, -0.75]));
            // objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, -0.95, 0.75], [0.75, -0.95, 0.75]));
            
            // left side
            objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]));
            objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75],  [-0.75, 0.95, 0.75]));

            // back side
            objects.push(new Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, -0.75], [-0.75, 0.95, -0.75]));
            objects.push(new Triangle([0.75, -0.95, -0.75], [0.75, 0.95, -0.75], [-0.75, 0.95, -0.75]));

            return objects;
        }

        private loadObject(filePath: string): Triangle[] {
            let triangles = [];

            let lines = loadFile(filePath).split('\n')

            let vertices = [];
            let faceIndexes = [];
            let meshVertices = [];

            // collect vertices and facets data
            for (let i = 0; i < lines.length; i++) {
                let parts = lines[i].split(" ");

                if (parts[0] === "v") {
                    vertices.push([parts[1], parts[2], parts[3]]);
                } else if (parts[0] === "f") {
                    faceIndexes.push((+parts[1]) - 1);
                    faceIndexes.push((+parts[2]) - 1);
                    faceIndexes.push((+parts[3]) - 1);
                }
            }

            // build all mesh vertices
            for (let i = 0; i < faceIndexes.length; i++) {
                meshVertices.push(
                    [vertices[faceIndexes[i]][0], vertices[faceIndexes[i]][1], vertices[faceIndexes[i]][2]]
                );
            }

            let primitivesCount: number = meshVertices.length / 3;
            for (let i = 0; i < primitivesCount; i++) {
                let a = meshVertices[i * 3];
                let b = meshVertices[i * 3 + 1];
                let c = meshVertices[i * 3 + 2];

                triangles.push(new Triangle(a, b, c));
            }

            return triangles;
        }
    }
}