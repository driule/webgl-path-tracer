namespace LH {

    export class Engine {

        //private frameCount: number = 0;
        private _canvas: HTMLCanvasElement;
        private _shader: Shader;

        public constructor() {
            console.log("Engine created.");
        }

        public start(): void {
            this._canvas = GLUtilities.initialize("pathTracer");

            gl.clearColor(0, 0, 0, 1);

            this.loadShaders();
            this._shader.use();

            this.tick();
        }

        public resize(): void {
            if (this._canvas !== undefined) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;
            }
        }

        private tick(): void {
            //this.frameCount++;
            //document.body.innerHTML = this.frameCount.toString();

            gl.clear(gl.COLOR_BUFFER_BIT);

            requestAnimationFrame(this.tick.bind(this));
        }

        private loadShaders(): void {
            let vertexShaderSource = `
                attribute vec3 a_position;
                void main() {
                    gl_Position = vec4(a_position, 1.0);
                }
            `;
            
            let fragmentShaderSource = `
                precision mediump float;
                void main() {
                    gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
                }
            `;

            this._shader = new Shader("basic", vertexShaderSource, fragmentShaderSource);
        }
    }
}