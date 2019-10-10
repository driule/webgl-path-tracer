import { gl } from ".././gl/GLUtilities";

export class Gauge {
    public primitiveCount: number;
    public mouseDownId: NodeJS.Timeout;

    private fps: number;
    private lastTick: number;
    private elapsedTime: number;
    private frameCount: number;

    public constructor() {
        this.primitiveCount = 0;
        this.mouseDownId = null;

        this.fps = 0;
        this.lastTick = Date.now();
        this.elapsedTime = 0;
        this.frameCount = 0;
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
    }

    public detectDevice(): string {
            let debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
            let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

            console.log('detected device:', vendor + " " + renderer);

            return vendor + " " + renderer;
    }
}