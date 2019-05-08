namespace LH {

    export class Camera {

        private _canvas: HTMLCanvasElement;

        private _angleX: number;
        private _angleY: number;
        private _zoomZ: number;

        private _axisX: number;
        private _axisY: number;
        private _axisZ: number;

        private _eye: any;
        private _viewProjectionMatrix: any;

        public constructor(canvas: HTMLCanvasElement) {
            this._canvas = canvas;

            this._angleX = 0.2;
            this._angleY = 5.75;
            this._zoomZ = 50.0;

            this._axisX = 0.0;
            this._axisY = 0.0;
            this._axisZ = 0.0;

            this._eye = glMatrix.vec3.create();
            this.calculateViewProjection();
        }

        public get eye(): any {
            return this._eye;
        }

        public get viewProjectionMatrix(): any {
            return this._viewProjectionMatrix;
        }

        public calculateViewProjection(): void {
            this._eye[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
            this._eye[1] = this._zoomZ * Math.sin(this._angleX);
            this._eye[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);

            let view = glMatrix.mat4.lookAt([], this._eye, [this._axisX, this._axisY, this._axisZ], [0, 1, 0]);
            let projection = glMatrix.mat4.perspective([], Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
            this._viewProjectionMatrix = glMatrix.mat4.multiply([], projection, view);
            this._viewProjectionMatrix = glMatrix.mat4.invert([], this._viewProjectionMatrix);
        }
        
        public getEyeRay(x: number, y: number): any {
            // jitter view-projection matrix for anti-aliasing
            let jitterVector = [(Math.random() * 2 - 1) / this._canvas.width, (Math.random() * 2 - 1) / this._canvas.height, 0];
            let viewProjectionMatrix = glMatrix.mat4.translate([], this._viewProjectionMatrix, jitterVector);

            let transformedVector = glMatrix.vec4.transformMat4([], [x, y, 0, 1], viewProjectionMatrix);
            let scaledVector = glMatrix.vec4.scale([], transformedVector, 1.00 / transformedVector[3]);

            return glMatrix.vec3.subtract([], [scaledVector[0], scaledVector[1], scaledVector[2]], this._eye);
        }

        // movement controls
        public moveUp(step: number = 0.1): void {
            this._angleX += step;
        }

        public moveDown(step: number = 0.1): void {
            this._angleX -= step;
        }

        public moveRight(step: number = 0.1): void {
            this._angleY += step;
        }

        public moveLeft(step: number = 0.1): void {
            this._angleY -= step;
        }

        public zoomIn(step: number = 0.1): void {
            this._zoomZ -= step;
        }

        public zoomOut(step: number = 0.1): void {
            this._zoomZ += step;
        }

        // rotatation controls
        public rotateUp(step: number = 0.1): void {
            this._axisY += step;
        }

        public rotateDown(step: number = 0.1): void {
            this._axisY -= step;
        }

        public rotateRight(step: number = 0.1): void {
            this._axisX += step;
        }

        public rotateLeft(step: number = 0.1): void {
            this._axisX -= step;
        }
    }
}