import { vec3, vec4, mat4 } from "gl-matrix";

export class Camera {

    private _canvas: HTMLCanvasElement;

    private _angleX: number;
    private _angleY: number;
    private _zoomZ: number;

    private _axisX: number;
    private _axisY: number;
    private _axisZ: number;

    private _movementSpeed: number;

    private _eye: any; // vec3
    private _viewProjectionMatrix: any; //mat4

    public constructor(canvas: HTMLCanvasElement, initialView: any = [0.2, 5.75, 50.0], initialAxes: any = [0.0, 0.0, 0.0], movementSpeed: number = 0.1) {
        this._canvas = canvas;

        this._angleX = initialView[0];
        this._angleY = initialView[1];
        this._zoomZ = initialView[2];

        this._axisX = initialAxes[0];
        this._axisY = initialAxes[1];
        this._axisZ = initialAxes[2];

        this._movementSpeed = movementSpeed;

        this._eye = vec3.create();
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

        let view: mat4 = mat4.lookAt(mat4.create(), this._eye, [this._axisX, this._axisY, this._axisZ], [0, 1, 0]);
        let projection = mat4.perspective(mat4.create(), Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
        this._viewProjectionMatrix = mat4.multiply(mat4.create(), projection, view);
        this._viewProjectionMatrix = mat4.invert(mat4.create(), this._viewProjectionMatrix);
    }
    
    public getEyeRay(x: number, y: number): any {
        // jitter view-projection matrix for anti-aliasing
        let jitterVector = [(Math.random() * 2 - 1) / this._canvas.width, (Math.random() * 2 - 1) / this._canvas.height, 0];
        let viewProjectionMatrix = mat4.translate(mat4.create(), this._viewProjectionMatrix, jitterVector);

        let transformedVector = vec4.transformMat4(vec4.create(), [x, y, 0, 1], viewProjectionMatrix);
        let scaledVector = vec4.scale(vec4.create(), transformedVector, 1.00 / transformedVector[3]);

        return vec3.subtract(vec3.create(), [scaledVector[0], scaledVector[1], scaledVector[2]], this._eye);
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

    public zoomIn(): void {
        this._zoomZ -= this._movementSpeed;
    }

    public zoomOut(): void {
        this._zoomZ += this._movementSpeed;
    }

    // rotatation controls
    public rotateUp(): void {
        this._axisY += this._movementSpeed;
    }

    public rotateDown(): void {
        this._axisY -= this._movementSpeed;
    }

    public rotateRight(): void {
        this._axisX += this._movementSpeed;
    }

    public rotateLeft(): void {
        this._axisX -= this._movementSpeed;
    }
}
