namespace LH {

    export class Renderer {

        private _pathTracer: PathTracer;
        private _canvas: HTMLCanvasElement;

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
        
            let modelview = this.makeLookAt(eye.elements[0], eye.elements[1], eye.elements[2], 0, 0, 0, 0, 1, 0);
            let projection = this.makePerspective(55, 1, 0.1, 100);
            let modelviewProjection = projection.multiply(modelview);
            this.update(modelviewProjection, timeSinceStart);
            
            this._pathTracer.render();

            requestAnimationFrame(this.tick.bind(this));
        }

        private makeLookAt(ex, ey, ez, cx, cy, cz, ux, uy, uz)
        {
            let eye = $V([ex, ey, ez]);
            let center = $V([cx, cy, cz]);
            let up = $V([ux, uy, uz]);

            let z = eye.subtract(center).toUnitVector();
            let x = up.cross(z).toUnitVector();
            let y = z.cross(x).toUnitVector();

            var m = $M(
                [
                    [x.e(1), x.e(2), x.e(3), 0],
                    [y.e(1), y.e(2), y.e(3), 0],
                    [z.e(1), z.e(2), z.e(3), 0],
                    [0, 0, 0, 1]
                ]
            );

            var t = $M(
                [
                    [1, 0, 0, -ex],
                    [0, 1, 0, -ey],
                    [0, 0, 1, -ez],
                    [0, 0, 0, 1]
                ]
            );

            return m.x(t);
        }

        private makePerspective(fovy, aspect, znear, zfar)
        {
            var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
            var ymin = -ymax;
            var xmin = ymin * aspect;
            var xmax = ymax * aspect;

            return this.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
        }

        private makeFrustum(left, right, bottom, top, znear, zfar)
        {
            var X = 2 * znear / (right - left);
            var Y = 2 * znear / (top - bottom);
            var A = (right + left) / (right - left);
            var B = (top + bottom) / (top - bottom);
            var C = -(zfar + znear) / (zfar - znear);
            var D = -2 * zfar * znear / (zfar - znear);

            return $M(
                [
                    [X, 0, A, 0],
                    [0, Y, B, 0],
                    [0, 0, C, D],
                    [0, 0, -1, 0]
                ]
            );
        }
        
        private makeSphereColumn() {
            let objects = [];

            objects.push(new LH.Sphere(Vector.create([0, -0.25, 0]), 0.25, nextObjectId++));
            objects.push(new LH.Sphere(Vector.create([0, -0.75, 0]), 0.25, nextObjectId++));
        
            return objects;
        }
    }
}