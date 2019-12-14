import { gl } from ".././gl/GLUtilities";

const TOTAL_EVALUATION_FRAMES: number = 100;

export class Gauge {
    public primitiveCount: number;
    public mouseDownId: NodeJS.Timeout;

    private fps: number;
    private lastTick: number;
    private elapsedTime: number;
    private frameCount: number;

    // performance evaluation
    private totalFramesEvaluated: number;
    private startTick: number;

    public hasEvaluated: boolean;
    public minFps: number;
    public maxFps: number;
    public averageFps: number;
    public bvhBuildTime: number;

    public constructor() {
        this.primitiveCount = 0;
        this.mouseDownId = null;

        this.fps = 0;
        this.lastTick = Date.now();
        this.elapsedTime = 0;
        this.frameCount = 0;

        this.hasEvaluated = false;
    }

    public getFps(): number {
        return this.fps;
    }

    public measureFPS(): void {
        let currentTick = new Date().getTime();

        this.frameCount++;
        this.elapsedTime += (currentTick - this.lastTick);
        this.lastTick = currentTick;

        if (this.elapsedTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.elapsedTime %= 1000;
        }

        // performance evaluation
        if (!this.hasEvaluated && this.totalFramesEvaluated < TOTAL_EVALUATION_FRAMES) {
            
            // fps peak/drop detection
            if (this.fps < this.minFps) {
                this.minFps = this.fps;
            }
            if (this.fps > this.maxFps) {
                this.maxFps = this.fps;
            }

            this.totalFramesEvaluated++;
            if (this.totalFramesEvaluated == TOTAL_EVALUATION_FRAMES) {
                let elapsedTime = (currentTick - this.startTick) / 1000;
                this.averageFps = this.totalFramesEvaluated / (elapsedTime);

                this.hasEvaluated = true;
            }
        }
    }

    public evaluatePerformance(): void {
        this.startTick = new Date().getTime();
        this.totalFramesEvaluated = 0;
        this.minFps = this.fps;
        this.maxFps = this.fps;
        this.hasEvaluated = false;
    }
}