import { PathTracer } from "./PathTracer";
import { Scene } from "./Scene";
import { Gauge } from "./utilities/Gauge";
import { gl } from "./gl/GLUtilities";

export class Renderer {

    private canvas: HTMLCanvasElement;
    private gauge: Gauge;
    
    private pathTracer: PathTracer;
    private scene: Scene;

    private isRendering: boolean;

    public constructor(canvas: HTMLCanvasElement, gauge: Gauge) {
        this.canvas = canvas;
        this.gauge = gauge;
        this.pathTracer = new PathTracer(this.canvas);
    }

    public start(): void {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.isRendering = true;
        this.tick();
    }

    public stop(): void {
        this.isRendering = false;
    }

    public resize(canvas: HTMLCanvasElement): void {
        this.stop();

        this.canvas = canvas;
        this.pathTracer = new PathTracer(this.canvas);

        gl.canvas.width = this.canvas.width;
        gl.canvas.height = this.canvas.height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    public setScene(scene: Scene): void {
        this.scene = scene;
        this.pathTracer.setScene(this.scene);
        this.gauge.primitiveCount = this.scene.getTriangles().length;
        this.gauge.bvhBuildTime = this.scene.getBVH().getBuildingTime();
    }

    private tick(): void {
        if (this.isRendering) {
            this.pathTracer.render();
            this.gauge.measureFPS();
            requestAnimationFrame(this.tick.bind(this));
        }
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