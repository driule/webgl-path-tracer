import { vec3, vec4, mat4 } from "gl-matrix";

export class Camera {

    private _canvas: HTMLCanvasElement;

    private _angleX: number;
    private _angleY: number;
    private _zoomZ: number;

    private frontDirection: vec3;
    private upDirection: vec3;

    private movementSpeed: number;
    private rotationSpeed: number;

    private _eye: vec3;
    private _viewProjectionMatrix: mat4;

    public constructor(canvas: HTMLCanvasElement, initialView: any = [0.2, 5.75, 50.0], movementSpeed: number = 0.1) {
        this._canvas = canvas;

        this._angleX = initialView[0];
        this._angleY = initialView[1];
        this._zoomZ = initialView[2];

        this.movementSpeed = movementSpeed;
        this.rotationSpeed = 0.1;

        this.frontDirection = vec3.fromValues(0.0, 0.0, -1.0);
        this.upDirection = vec3.fromValues(0.0, 1.0, 0.0);

        this._eye = vec3.fromValues(0.0, 0.0, 3.0);
        this.calculateViewProjection();
    }

    public get eye(): any {
        return this._eye;
    }

    public calculateViewProjection(): void {

        // rotation
        this.frontDirection[0] = this._zoomZ * Math.sin(this._angleY) * Math.cos(this._angleX);
        this.frontDirection[1] = this._zoomZ * Math.sin(this._angleX);
        this.frontDirection[2] = this._zoomZ * Math.cos(this._angleY) * Math.cos(this._angleX);

        let view: mat4 = mat4.lookAt(
            mat4.create(),
            this._eye,
            vec3.add(vec3.create(), this._eye, this.frontDirection),
            this.upDirection
        );
        let projection = mat4.perspective(mat4.create(), Math.PI / 3, this._canvas.width / this._canvas.height, 0.1, 1000);
        this._viewProjectionMatrix = mat4.invert(mat4.create(), mat4.multiply(mat4.create(), projection, view));
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
    public moveUp(): void {
        this._eye = vec3.add(vec3.create(), this._eye, vec3.scale(vec3.create(), this.frontDirection, this.movementSpeed));
    }

    public moveDown(): void {
        this._eye = vec3.sub(vec3.create(), this._eye, vec3.scale(vec3.create(), this.frontDirection, this.movementSpeed));
    }

    public moveRight(): void {
        this._eye = vec3.add(
            vec3.create(),
            this._eye,
            vec3.scale(
                vec3.create(),
                vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.frontDirection, this.upDirection)),
                this.movementSpeed
            )
        );
    }

    public moveLeft(): void {
        this._eye = vec3.sub(
            vec3.create(),
            this._eye,
            vec3.scale(
                vec3.create(),
                vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.frontDirection, this.upDirection)),
                this.movementSpeed
            )
        );
    }

    // zoom controls
    public zoomIn(): void {
        this._zoomZ -= this.movementSpeed;
    }

    public zoomOut(): void {
        this._zoomZ += this.movementSpeed;
    }

    // rotation controls
    public rotateUp(): void {
        this._angleX += this.rotationSpeed;
    }

    public rotateDown(): void {
        this._angleX -= this.rotationSpeed;
    }

    public rotateRight(): void {
        this._angleY -= this.rotationSpeed;
    }

    public rotateLeft(): void {
        this._angleY += this.rotationSpeed;
    }
}
