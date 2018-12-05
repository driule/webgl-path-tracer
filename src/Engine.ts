namespace LH {

    export class Engine {

        //private frameCount: number = 0;
        private _canvas: HTMLCanvasElement;
        private _shader: Shader;
        private _buffer: WebGLBuffer;

        public constructor() {
            console.log("Engine created.");
        }

        public start(): void {
            this._canvas = GLUtilities.initialize("pathTracer");

            gl.clearColor(0, 0, 0, 1);

            this.loadShaders();
            this._shader.use();
            this.createBuffer();

            this.tick();
        }

        private tick(): void {
            //this.frameCount++;
            //document.body.innerHTML = this.frameCount.toString();

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
            gl.enableVertexAttribArray(0);

            gl.drawArrays(gl.TRIANGLES, 0, 3);

            requestAnimationFrame(this.tick.bind(this));
        }

        public resize(): void {
            if (this._canvas !== undefined) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;

                gl.viewport(0, 0, this._canvas.width, this._canvas.height);
            }
        }

        private createBuffer(): void {
            let vertices = [
                // x, y, z
                0, 0, 0,
                0, 0.5, 0,
                0.5, 0.5, 0
            ];

            this._buffer = gl.createBuffer();

            gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            //gl.enableVertexAttribArray(0);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, undefined);
            //gl.disableVertexAttribArray(0);
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
                    gl_FragColor = vec4(0.5, 0.0, 0.0, 1.0);
                }
            `;

            this._shader = new Shader("basic", vertexShaderSource, fragmentShaderSource);
        }
    }
}