namespace LH {

    export class Renderer {

        private _canvas: HTMLCanvasElement;
        private _pathTracer: PathTracer;
        private _scene: Scene;
        private _gauge: Gauge;

        private _isRendering: boolean;

        public constructor(gauge: Gauge) {
            this._canvas = GLUtilities.initialize('pathTracer');
            this._pathTracer = new PathTracer(this._canvas);
            this._gauge = gauge;
        }

        public start(): void {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            this.loadTeddyScene();
            this._isRendering = true;

            let startTime = Date.now();
            this.tick((Date.now() - startTime) * 0.001);
        }

        public tick(timeSinceStart: number): void {
            this._pathTracer.update(timeSinceStart);
            this._pathTracer.render();

            this._gauge.measureFPS();

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

        private restart(): void {
            this._gauge.primitiveCount = this._scene.triangles.length;
            this._scene.camera.calculateViewProjection();
            this._pathTracer.setScene(this._scene);
            this._pathTracer.restart();
        }

        public loadHouseScene(): void {
            let lights: Light[] = [
                new Light([0.0, 15.75, 20.25], 0.25, 35.0),
                new Light([120.25, 1272.75, 0.25], 1.5, 1000.0),
                new Light([-20.25, 40.75, 0.25], 0.15, 15.0)
            ];

            let camera = new Camera(this._canvas, [0.2, 5.75, 950.0], 20.0);

            this._scene = new Scene(camera);
            this._scene.setLights(lights);
            // this._scene.loadModel('assets/models/cottage/cottage_obj.obj');
            // this._scene.loadModel('assets/models/mill/low-poly-mill.obj');
            this._scene.loadModel('assets/models/earth/earth.obj');

            this.restart();
        }

        public loadTeddyScene(): void {
            let lights: Light[] = [
                new Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new Light([20.25, 22.75, 0.25], 1.5, 10.0),
                new Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];

            let camera = new Camera(this._canvas, [0.2, 5.75, 75.0], 2.0);

            this._scene = new Scene(camera);
            this._scene.setLights(lights);
            this._scene.loadModel('assets/models/teddy.obj');
            // this._scene.loadModel('assets/teddy.obj', [40, 0, 0]);

            this.restart();
        }

        public loadBasicScene(): void {
            let lights: Light[] = [
                new Light([0.0, 1.75, 0.25], 0.25, 12.5),
            ];

            let camera = new Camera(this._canvas, [0.0, 0.0, 2.5]);

            this._scene = new Scene(camera);
            this._scene.setLights(lights);

            this._scene.setTriangles([
                // ground plane
                new Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, 0.75], [0.75, -0.95, -0.75]),
                new Triangle([-0.75, -0.95, -0.75], [-0.75, -0.95, 0.75], [0.75, -0.95, 0.75]),

                // left wall
                new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]),
                new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75],  [-0.75, 0.95, 0.75]),

                // back wall
                new Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, -0.75], [-0.75, 0.95, -0.75]),
                new Triangle([0.75, -0.95, -0.75], [0.75, 0.95, -0.75], [-0.75, 0.95, -0.75])
            ]);

            this.restart();
        }

        //
        // camera controls
        //
        public moveUp(): void {
            this._scene.camera.moveUp();
            this.restart();
        }

        public moveDown(): void {
            this._scene.camera.moveDown();
            this.restart();
        }

        public moveRight(): void {
            this._scene.camera.moveRight();
            this.restart();
        }

        public moveLeft(): void {
            this._scene.camera.moveLeft();
            this.restart();
        }

        public zoomIn(): void {
            this._scene.camera.zoomIn();
            this.restart();
        }

        public zoomOut(): void {
            this._scene.camera.zoomOut();
            this.restart();
        }
        
        public rotateUp(): void {
            this._scene.camera.rotateUp();
            this.restart();
        }

        public rotateDown(): void {
            this._scene.camera.rotateDown();
            this.restart();
        }

        public rotateRight(): void {
            this._scene.camera.rotateRight();
            this.restart();
        }

        public rotateLeft(): void {
            this._scene.camera.rotateLeft();
            this.restart();
        }
    }
}