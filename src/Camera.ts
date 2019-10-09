import { vec3, vec4, mat4 } from "gl-matrix";

export class Camera {

    private canvas: HTMLCanvasElement;

    private position: vec3;
    private angleX: number;
    private angleY: number;
    private fieldOfView: number;

    private frontDirection: vec3;
    private upDirection: vec3;

    private movementSpeed: number;
    private rotationSpeed: number;
    private zoomSpeed: number;

    private viewProjectionMatrix: mat4;

    public constructor(
        canvas: HTMLCanvasElement,
        position: vec3 = vec3.fromValues(0.0, 0.0, 2.5),
        angleX: number = 0.0,
        angleY: number = 3.15,
        movementSpeed: number = 0.1 * 10,
        rotationSpeed: number = 0.05 * 10
    ) {
        this.canvas = canvas;

        this.position = position;
        this.angleX = angleX;
        this.angleY = angleY;
        this.fieldOfView = Math.PI / 3;

        this.frontDirection = vec3.fromValues(0.0, 0.0, -1.0);
        this.upDirection = vec3.fromValues(0.0, 1.0, 0.0);

        this.movementSpeed = movementSpeed;
        this.rotationSpeed = rotationSpeed;
        this.zoomSpeed = 0.01;

        this.calculateViewProjection();
    }

    public getPosition(): vec3 {
        return this.position;
    }

    public calculateViewProjection(): void {
        this.frontDirection[0] = Math.sin(this.angleY) * Math.cos(this.angleX);
        this.frontDirection[1] = Math.sin(this.angleX);
        this.frontDirection[2] = Math.cos(this.angleY) * Math.cos(this.angleX);

        let view: mat4 = mat4.lookAt(
            mat4.create(),
            this.position,
            vec3.add(vec3.create(), this.position, this.frontDirection),
            this.upDirection
        );
        let projection = mat4.perspective(mat4.create(), this.fieldOfView, this.canvas.width / this.canvas.height, 0.1, 1000);
        this.viewProjectionMatrix = mat4.invert(mat4.create(), mat4.multiply(mat4.create(), projection, view));
        
        // console.log('Camera configuration:', this.position, this.angleX, this.angleY);
    }
    
    public getRay(x: number, y: number): vec3 {
        // jitter view-projection matrix for anti-aliasing
        let jitterVector = [(Math.random() * 2 - 1) / this.canvas.width, (Math.random() * 2 - 1) / this.canvas.height, 0];
        let viewProjectionMatrix = mat4.translate(mat4.create(), this.viewProjectionMatrix, jitterVector);

        let transformedVector = vec4.transformMat4(vec4.create(), [x, y, 0, 1], viewProjectionMatrix);
        let scaledVector = vec4.scale(vec4.create(), transformedVector, 1.00 / transformedVector[3]);

        return vec3.subtract(vec3.create(), [scaledVector[0], scaledVector[1], scaledVector[2]], this.position);
    }

    // movement controls
    public moveUp(): void {
        this.position = vec3.add(vec3.create(), this.position, vec3.scale(vec3.create(), this.frontDirection, this.movementSpeed));
    }

    public moveDown(): void {
        this.position = vec3.sub(vec3.create(), this.position, vec3.scale(vec3.create(), this.frontDirection, this.movementSpeed));
    }

    public moveRight(): void {
        this.position = vec3.add(
            vec3.create(),
            this.position,
            vec3.scale(
                vec3.create(),
                vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.frontDirection, this.upDirection)),
                this.movementSpeed
            )
        );
    }

    public moveLeft(): void {
        this.position = vec3.sub(
            vec3.create(),
            this.position,
            vec3.scale(
                vec3.create(),
                vec3.normalize(vec3.create(), vec3.cross(vec3.create(), this.frontDirection, this.upDirection)),
                this.movementSpeed
            )
        );
    }

    // zoom controls
    public zoomIn(): void {
        this.fieldOfView -= this.zoomSpeed;
    }

    public zoomOut(): void {
        this.fieldOfView += this.zoomSpeed;
    }

    // rotation controls
    public rotateUp(): void {
        this.angleX += this.rotationSpeed;
    }

    public rotateDown(): void {
        this.angleX -= this.rotationSpeed;
    }

    public rotateRight(): void {
        this.angleY -= this.rotationSpeed;
    }

    public rotateLeft(): void {
        this.angleY += this.rotationSpeed;
    }
}
