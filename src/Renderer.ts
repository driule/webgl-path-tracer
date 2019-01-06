namespace LH {

    export class Renderer {

        private _pathTracer: PathTracer;
        private _canvas: HTMLCanvasElement;

        private _angleX: number;
        private _angleY: number;
        private _zoomZ: number;
        private _eye: any;

        public constructor() {
            this._canvas = GLUtilities.initialize("pathTracer");
            this._pathTracer = new PathTracer();

            this._angleX = 0;
            this._angleY = 0;
            this._zoomZ = 2.5;
            this._eye = glMatrix.vec3.create();
        }

        public start(): void {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // create scene
            let spheres = this.createSphereColumn();
            this._pathTracer.setObjects(spheres, new Light());

            var startTime = Date.now();
            this.tick((Date.now() - startTime) * 0.001);
        }

        public tick(timeSinceStart: number): void {
            this._eye[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
            this._eye[1] = this._zoomZ * Math.sin(this._angleX);
            this._eye[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);

            let view = glMatrix.mat4.lookAt([], this._eye, [0, 0, 0], [0, 1, 0]);
            let projection = glMatrix.mat4.perspective([], Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
            let viewProjection = glMatrix.mat4.multiply([], projection, view);
            viewProjection = glMatrix.mat4.invert([], viewProjection);

            // TODO: implement jitter to avoid edgy lines
            //let jitter = glMatrix.mat4.fromTranslation([], [Math.random() * 2 - 1, Math.random() * 2 - 1, 0]);
            //jitter = glMatrix.mat4.multiplyScalar([], jitter, (1.00 / 512.00));
            //viewProjection = glMatrix.mat4.multiply([], jitter, viewProjection);
            //viewProjection = glMatrix.mat4.invert([], viewProjection);
            
            this._pathTracer.update(viewProjection, timeSinceStart, this._eye);
            this._pathTracer.render();

            requestAnimationFrame(this.tick.bind(this));
        }
        
        private createSphereColumn() {
            let objects = [];

            objects.push(new Sphere(glMatrix.vec3.fromValues(0, -0.75, 0), 0.33));
            objects.push(new Sphere(glMatrix.vec3.fromValues(0, -0.10, 0), 0.30));
            objects.push(new Sphere(glMatrix.vec3.fromValues(0, 0.45, 0), 0.25));
        
            return objects;
        }
    }
}