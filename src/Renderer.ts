namespace LH {

    export class Renderer {

        private _pathTracer: PathTracer;
        private _canvas: HTMLCanvasElement;

        private modelview;
        private projection;
        private modelviewProjection;

        public constructor() {
            this._canvas = GLUtilities.initialize("pathTracer");
            this._pathTracer = new PathTracer();
        }

        public start(): void {
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // create scene
            let objects = this.makeSphereColumn();
            objects.splice(0, 0, new LH.Light());
            this._pathTracer.setObjects(objects);

            var start = new Date();
            // TODO: use setInterval to avoid stripes on the output image
            //setInterval(function() { this.tick((new Date() - start) * 0.001); }, 1000 / 60);
            this.tick((new Date() - start));
        }
          
        public update(modelviewProjection: Matrix, timeSinceStart: number): void {
            var jitter = Matrix.Translation(Vector.create([Math.random() * 2 - 1, Math.random() * 2 - 1, 0]).multiply(1 / 512));
            var inverse = jitter.multiply(modelviewProjection).inverse();
            this._pathTracer.update(inverse, timeSinceStart);
        }

        public tick(timeSinceStart: number): void {
            eye.elements[0] = zoomZ * Math.sin(angleY) * Math.cos(angleX);
            eye.elements[1] = zoomZ * Math.sin(angleX);
            eye.elements[2] = zoomZ * Math.cos(angleY) * Math.cos(angleX);
        
            this.modelview = makeLookAt(eye.elements[0], eye.elements[1], eye.elements[2], 0, 0, 0, 0, 1, 0);
            this.projection = makePerspective(55, 1, 0.1, 100);
            this.modelviewProjection = this.projection.multiply(this.modelview);
            this.update(this.modelviewProjection, timeSinceStart);
            
            this._pathTracer.render();

            requestAnimationFrame(this.tick.bind(this));
        }
        
        public makeSphereColumn() {
            let objects = [];
            
            objects.push(new LH.Sphere(Vector.create([0, -0.25, 0]), 0.25, nextObjectId++));
            objects.push(new LH.Sphere(Vector.create([0, -0.75, 0]), 0.25, nextObjectId++));
        
            return objects;
        }
    }
}