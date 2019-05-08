namespace LH {

    export class Renderer {

        private _canvas: HTMLCanvasElement;

        private _pathTracer: PathTracer;
        private _scene: Scene;

        private _isRendering: boolean;

        public constructor() {
            this._canvas = GLUtilities.initialize('pathTracer');
            this._pathTracer = new PathTracer([this._canvas.width, this._canvas.height]);
        }

        public start(): void {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


            this._scene = this.createScene();
            this._pathTracer.setScene(this._scene);
            this._isRendering = true;

            // ToDo: encapsulate in Gauge class
            primitiveCount = this._scene.triangles.length;

            //var startTime = Date.now();
            //this.tick((Date.now() - startTime) * 0.001);
        }

        private createScene(): Scene {
            let lights: Light[] = [
                new Light([0.0, 5.75, 20.25], 0.25, 35.0),
                new Light([20.25, 22.75, 0.25], 1.5, 10.0),
                new Light([-20.25, 20.75, 0.25], 0.15, 15.0)
            ];

            let camera = new Camera(this._canvas, [0.2, 5.75, 75.0]);

            let scene: Scene = new Scene(camera);
            scene.setLights(lights);
            scene.loadModel('assets/teddy.obj');
            scene.loadModel('assets/teddy.obj', [40, 0, 0]);

            return scene;
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

        private restart(): void {
            this._scene.camera.calculateViewProjection();
            this._pathTracer.restart();
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
    }
}