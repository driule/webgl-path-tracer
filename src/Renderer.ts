namespace LH {

    export class Renderer {

        private _pathTracer: PathTracer;
        private _canvas: HTMLCanvasElement;

        private _angleX: number;
        private _angleY: number;
        private _zoomZ: number;
        private _eye: any;
        private _viewProjection: any;

        public constructor() {
            this._canvas = GLUtilities.initialize("pathTracer");
            this._pathTracer = new PathTracer([this._canvas.width, this._canvas.height]);

            this._angleX = 0;
            this._angleY = 0;
            this._zoomZ = 2.5;
            this._eye = glMatrix.vec3.create();
        }

        public start(): void {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // create scene
            let triangles = this.createTriangles();
            // let triangles = this.loadObject('assets/teddy.obj');
            let lights: Light[] = [new Light([12.25, 15.75, 0.25], 0.75, 5.0)];
            this._pathTracer.setObjects(triangles, lights);

            this.calculateViewProjection();

            primitiveCount = triangles.length;

            //var startTime = Date.now();
            //this.tick((Date.now() - startTime) * 0.001);
        }

        public tick(timeSinceStart: number): void {
            this._pathTracer.update(this._viewProjection, timeSinceStart, this._eye);
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

            requestAnimationFrame(this.tick.bind(this));
        }

        private calculateViewProjection(): void {
            this._eye[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
            this._eye[1] = this._zoomZ * Math.sin(this._angleX);
            this._eye[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);

            let view = glMatrix.mat4.lookAt([], this._eye, [0, 0, 0], [0, 1, 0]);
            let projection = glMatrix.mat4.perspective([], Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
            this._viewProjection = glMatrix.mat4.multiply([], projection, view);
            this._viewProjection = glMatrix.mat4.invert([], this._viewProjection);
        }

        //
        // camera controls
        //
        public moveUp(): void {
            this._angleX += 0.1;
            this.restart();
        }

        public moveDown(): void {
            this._angleX -= 0.1;
            this.restart();
        }

        public moveRight(): void {
            this._angleY += 0.1;
            this.restart();
        }

        public moveLeft(): void {
            this._angleY -= 0.1;
            this.restart();
        }

        public zoomIn(): void {
            this._zoomZ -= 0.1;
            this.restart();
        }

        public zoomOut(): void {
            this._zoomZ += 0.1;
            this.restart();
        }

        private restart(): void {
            this._pathTracer.restart();
            this.calculateViewProjection();
        }
        
        //
        // scene objects
        //

        private createTriangles() {
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
            objects.push(new Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, 0.75], [0.75, -0.95, -0.75]));
            objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, -0.95, 0.75], [0.75, -0.95, 0.75]));
            
            // left side
            objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, 0.75], [-0.75, -0.95, 0.75]));
            objects.push(new Triangle([-0.75, -0.95, -0.75], [-0.75, 0.95, -0.75],  [-0.75, 0.95, 0.75]));

            // back side
            objects.push(new Triangle([-0.75, -0.95, -0.75], [0.75, -0.95, -0.75], [-0.75, 0.95, -0.75]));
            objects.push(new Triangle([0.75, -0.95, -0.75], [0.75, 0.95, -0.75], [-0.75, 0.95, -0.75]));

            return objects;
        }

        private loadObject(filePath: string) {
            let triangles = [];

            let xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", filePath, false);
            xmlhttp.send(null);
            let fileContent = xmlhttp.responseText;
            let fileArray = fileContent.split('\n')

            let vertices = [];
            let faceIndexes = [];
            let meshVertices = [];

            // collect vertices and facets data
            for (let i = 0; i < fileArray.length; i++) {
                let line = fileArray[i];

                let parts = line.split(" ");

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