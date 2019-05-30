import { PathTracer } from "./PathTracer";
import { Scene } from "./Scene";
import { Gauge } from "./utilities/Gauge";
import { gl } from "./gl/GLUtilities";

export class Renderer {

    private canvas: HTMLCanvasElement;
    private pathTracer: PathTracer;
    private scene: Scene;
    private gauge: Gauge;

    private isRendering: boolean;

    public constructor(canvas: HTMLCanvasElement, gauge: Gauge) {
        this.canvas = canvas;
        this.pathTracer = new PathTracer(this.canvas);
        this.gauge = gauge;
    }

    public start(): void {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.isRendering = true;

        let startTime = new Date().getTime();
        this.tick(new Date().getTime() - startTime);
    }

    public tick(timeSinceStart: number): void {
        this.pathTracer.render(timeSinceStart / 1000.0);

        this.gauge.measureFPS();

        if (this.isRendering) {
            requestAnimationFrame(this.tick.bind(this));
        }
    }

    public setScene(scene: Scene): void {
        this.scene = scene;
        this.pathTracer.setScene(this.scene);
        this.gauge.primitiveCount = this.scene.getTriangles().length;
    }

    public pause(): void {
        this.isRendering = false;
    }

    public resume(): void {
        this.isRendering = true;
    }

    private restart(): void {
        this.scene.getCamera().calculateViewProjection();
        this.pathTracer.restart();
    }

    //
    // camera controls
    //
    public moveUp(): void {
        this.scene.getCamera().moveUp();
        this.restart();
    }

    public moveDown(): void {
        this.scene.getCamera().moveDown();
        this.restart();
    }

    public moveRight(): void {
        this.scene.getCamera().moveRight();
        this.restart();
    }

    public moveLeft(): void {
        this.scene.getCamera().moveLeft();
        this.restart();
    }

    public zoomIn(): void {
        this.scene.getCamera().zoomIn();
        this.restart();
    }

    public zoomOut(): void {
        this.scene.getCamera().zoomOut();
        this.restart();
    }
    
    public rotateUp(): void {
        this.scene.getCamera().rotateUp();
        this.restart();
    }

    public rotateDown(): void {
        this.scene.getCamera().rotateDown();
        this.restart();
    }

    public rotateRight(): void {
        this.scene.getCamera().rotateRight();
        this.restart();
    }

    public rotateLeft(): void {
        this.scene.getCamera().rotateLeft();
        this.restart();
    }
}