import { PathTracer } from "./PathTracer";
import { Scene } from "./Scene";
import { Gauge } from "./utilities/Gauge";
import { gl } from "./gl/GLUtilities";

export class Renderer {

    private _canvas: HTMLCanvasElement;
    private _pathTracer: PathTracer;
    private _scene: Scene;
    private _gauge: Gauge;

    private _isRendering: boolean;

    public constructor(canvas: HTMLCanvasElement, gauge: Gauge) {
        this._canvas = canvas;
        this._pathTracer = new PathTracer(this._canvas);
        this._gauge = gauge;
    }

    public start(): void {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this._isRendering = true;

        let startTime = new Date().getTime();
        this.tick(new Date().getTime() - startTime);
    }

    public tick(timeSinceStart: number): void {
        this._pathTracer.render(timeSinceStart / 1000.0);

        this._gauge.measureFPS();

        if (this._isRendering) {
            requestAnimationFrame(this.tick.bind(this));
        }
    }

    public setScene(scene: Scene): void {
        this._scene = scene;
        this._pathTracer.setScene(this._scene);
        this._gauge.primitiveCount = this._scene.triangles.length;
    }

    public pause(): void {
        this._isRendering = false;
    }

    public resume(): void {
        this._isRendering = true;
    }

    private restart(): void {
        this._scene.camera.calculateViewProjection();
        this._pathTracer.restart();
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