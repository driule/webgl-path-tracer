namespace LH {

    export class Engine {

        private _frameCount: number = 0;
        private _canvas: HTMLCanvasElement;
        private _shader: Shader;
        private _projection: Matrix4x4;

        private _sprite: Sprite;

        public constructor() {
            console.log("Engine created.");
        }

        public start(): void {
            this._canvas = GLUtilities.initialize("pathTracer");

            gl.clearColor(0, 0, 0, 1);

            this.loadShaders();
            this._shader.use();

            // init geometry
            this._projection = Matrix4x4.orthographic(0, this._canvas.width, 0, this._canvas.height, -100.0, 100.0);

            this._sprite = new Sprite("quad");
            this._sprite.load();

            this.resize();
            this.tick();
        }

        private tick(): void {
            this._frameCount++;
            gl.clear(gl.COLOR_BUFFER_BIT);

            // set uniforms
            let colorPosition = this._shader.getUniformLocation("u_color");
            gl.uniform4f(colorPosition, 1, 0.5, 0, 1);

            let projectionPosition = this._shader.getUniformLocation("u_projection");
            gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this._projection.data));

            let modelLocation = this._shader.getUniformLocation("u_model");
            gl.uniformMatrix4fv(modelLocation, false, new Float32Array(Matrix4x4.translation(this._sprite.position).data));

            // render & animate
            this._sprite.position.x++;
            this._sprite.position.y++;

            if (this._sprite.position.x > 200) {
                this._sprite.position.x = 0;
            }
            if (this._sprite.position.y > 50) {
                this._sprite.position.y = 0;
            }

            this._sprite.draw();

            // run game loop
            requestAnimationFrame(this.tick.bind(this));
        }

        public resize(): void {
            if (this._canvas !== undefined) {
                this._canvas.width = window.innerWidth;
                this._canvas.height = window.innerHeight;

                gl.viewport(-1, 1, 1, -1);
            }
        }

        private loadShaders(): void {
            let vertexShaderSource = `
                attribute vec3 a_position;

                uniform mat4 u_projection;
                uniform mat4 u_model;

                void main() {
                    gl_Position = u_projection * u_model * vec4(a_position, 1.0);
                }
            `;
            
            let fragmentShaderSource = `
                precision mediump float;

                uniform vec4 u_color;

                void main() {
                    gl_FragColor = u_color;
                }
            `;

            this._shader = new Shader("basic", vertexShaderSource, fragmentShaderSource);
        }
    }
}