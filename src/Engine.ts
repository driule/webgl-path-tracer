namespace LH {

    export class Engine {

        //private frameCount: number = 0;
        private canvas: HTMLCanvasElement;

        public constructor() {
            console.log("Engine created.");
        }

        public start(): void {
            this.canvas = GLUtilities.initialize("pathTracer");

            gl.clearColor(0, 0, 0, 1);

            this.tick();
        }

        private tick(): void {
            //this.frameCount++;
            //document.body.innerHTML = this.frameCount.toString();

            gl.clear(gl.COLOR_BUFFER_BIT);

            requestAnimationFrame(this.tick.bind(this));
        }
    }
}