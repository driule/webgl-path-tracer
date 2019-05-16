export class Gauge {
    public primitiveCount: number;
    public mouseDownId: NodeJS.Timeout;

    private _fps: number;
    private _lastTick: number;
    private _elapsedTime: number;
    private _frameCount: number;

    public constructor() {
        this.primitiveCount = 0;
        this.mouseDownId = null;

        this._fps = 0;
        this._lastTick = Date.now();
        this._elapsedTime = 0;
        this._frameCount = 0;
    }

    public get fps(): number {
        return this._fps;
    }

    public measureFPS(): void {
        let currentTick = new Date().getTime();

        this._frameCount++;
        this._elapsedTime += (currentTick - this._lastTick);
        this._lastTick = currentTick;

        if (this._elapsedTime >= 1000) {
            this._fps = this._frameCount;
            this._frameCount = 0;
            this._elapsedTime -= 1000;
        }
    }
}