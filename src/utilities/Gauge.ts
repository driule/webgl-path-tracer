import { gl } from ".././gl/GLUtilities";

const TOTAL_EVALUATION_FRAMES: number = 100;

export class Gauge {
    public primitiveCount: number;
    public mouseDownId: NodeJS.Timeout;

    private fps: number;
    private frameRate: number;

    private startTick: number;
    private lastTick: number;
    private elapsedTime: number;

    private frameCount: number;
    private evaluatedFrameCount: number;

    public hasEvaluated: boolean;
    public isEvaluationRequested: boolean;

    // performance evaluation outcome
    public minFrameRate: number;
    public maxFrameRate: number;
    public averageFps: number;
    public bvhBuildTime: number;

    public constructor() {
        this.primitiveCount = 0;
        this.mouseDownId = null;
        this.reset();
    }

    public getFps(): number {
        return this.fps;
    }

    public getFrameRate(): number {
        return this.frameRate;
    }

    public measureFPS(): void {
        let currentTick = new Date().getTime();

        this.frameCount++;
        this.elapsedTime += (currentTick - this.lastTick);
        this.frameRate = currentTick - this.lastTick;//this.elapsedTime / this.frameCount;
        this.lastTick = currentTick;

        if (this.elapsedTime >= 1000) {
            this.fps = 1000.0 / (this.elapsedTime / this.frameCount);
            this.frameCount = 0;
            this.elapsedTime = 0;
        }

        // performance evaluation
        if (!this.hasEvaluated && this.evaluatedFrameCount < TOTAL_EVALUATION_FRAMES) {
            this.evaluatedFrameCount++;

            // frame rate peak/drop detection
            if (this.frameRate > 0.0) {
                if (this.frameRate < this.minFrameRate) {
                    this.minFrameRate = this.frameRate;
                }
                if (this.frameRate > this.maxFrameRate) {
                    this.maxFrameRate = this.frameRate;
                }
            }

            if (this.evaluatedFrameCount == TOTAL_EVALUATION_FRAMES) {
                let elapsedTime = (currentTick - this.startTick) / 1000.0;
                this.averageFps = this.evaluatedFrameCount / elapsedTime;

                this.hasEvaluated = true;
            }
        }
    }

    public reset(): void {
        this.fps = 0;
        this.frameRate = 0;

        this.lastTick = new Date().getTime();
        this.startTick = new Date().getTime();
        this.elapsedTime = 0;

        this.frameCount = 0;
        this.evaluatedFrameCount = 0;

        this.isEvaluationRequested = false;
        this.hasEvaluated = false;

        this.minFrameRate = Infinity;
        this.maxFrameRate = 0.0;
        this.averageFps = 0.0;
    }
}