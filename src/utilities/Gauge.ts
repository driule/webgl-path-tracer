export const TOTAL_EVALUATION_FRAMES: number = 500;
export const WARM_UP_FRAME_COUNT = 20;

export class Gauge {
    public primitiveCount: number;
    public mouseDownId: NodeJS.Timeout;

    private fps: number;
    private frameRate: number;

    private lastTick: number;
    private evaluationStartTick: number;
    private elapsedTime: number;

    private frameCount: number;
    public evaluatedFrameCount: number;

    public hasEvaluated: boolean;
    public isEvaluationRequested: boolean;

    // performance evaluation outcome
    // public minFrameRate: number;
    // public maxFrameRate: number;
    public averageFps: number;
    public fpsDeviation: number;
    public bvhBuildTime: number;

    private frameTimes: number[];

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
        let currentTick = performance.now();//new Date().getTime();

        this.frameCount++;
        this.elapsedTime += (currentTick - this.lastTick);
        this.frameRate = currentTick - this.lastTick;
        this.lastTick = currentTick;

        if (this.elapsedTime >= 1000) {
            this.fps = 1000.0 / (this.elapsedTime / this.frameCount);
            this.frameCount = 0;
            this.elapsedTime = 0;
        }

        // performance evaluation
        if (!this.hasEvaluated && this.evaluatedFrameCount < TOTAL_EVALUATION_FRAMES + WARM_UP_FRAME_COUNT) {
            this.evaluatedFrameCount++;
            if (this.evaluatedFrameCount < WARM_UP_FRAME_COUNT) return;

            if (this.evaluatedFrameCount == WARM_UP_FRAME_COUNT) {
                this.evaluationStartTick = performance.now();
                return;
            }

            this.frameTimes[this.evaluatedFrameCount - WARM_UP_FRAME_COUNT - 1] = this.frameRate;

            // frame rate peak/drop detection
            // if (this.frameRate > 0.0) {
            //     if (this.frameRate < this.minFrameRate) {
            //         this.minFrameRate = this.frameRate;
            //     }
            //     if (this.frameRate > this.maxFrameRate) {
            //         this.maxFrameRate = this.frameRate;
            //     }
            // }

            if (this.evaluatedFrameCount == TOTAL_EVALUATION_FRAMES + WARM_UP_FRAME_COUNT) {
                let elapsedTime = (currentTick - this.evaluationStartTick) / 1000.0;
                this.averageFps = (this.evaluatedFrameCount - WARM_UP_FRAME_COUNT) / elapsedTime;

                // calculate standart deviation
                let averageTime = 0;
                for (let i = 0; i < TOTAL_EVALUATION_FRAMES; i++) {
                    averageTime += this.frameTimes[i];
                }
                averageTime /= (TOTAL_EVALUATION_FRAMES);

                let sum = 0;
                for (let i = 0; i < TOTAL_EVALUATION_FRAMES; i++) {
                    sum += (this.frameTimes[i] - averageTime) * (this.frameTimes[i] - averageTime);
                }
                this.fpsDeviation = Math.sqrt(sum / (TOTAL_EVALUATION_FRAMES));

                this.hasEvaluated = true;
            }
        }
    }

    public reset(): void {
        this.fps = 0;
        this.frameRate = 0;

        this.lastTick = performance.now();
        this.evaluationStartTick = performance.now();
        this.elapsedTime = 0;

        this.frameCount = 0;
        this.evaluatedFrameCount = 0;
        
        this.fpsDeviation = 0;
        this.frameTimes = [];

        this.isEvaluationRequested = false;
        this.hasEvaluated = false;

        // this.minFrameRate = Infinity;
        // this.maxFrameRate = 0.0;
        this.averageFps = 0.0;
    }
}