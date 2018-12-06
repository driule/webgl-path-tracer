namespace LH {

    export class Shader {

        private _name: string;
        private _program: WebGLProgram;
        private _attributes: {[name: string]: number} = {};
        private _uniforms: {[name: string]: WebGLUniformLocation} = {};
        
        public constructor(name: string, vertexSource: string, fragmentSource: string) {
            this._name = name;

            let vertexShader = this.loadShader(vertexSource, gl.VERTEX_SHADER);
            let fragmentShader = this.loadShader(fragmentSource, gl.FRAGMENT_SHADER);

            this.createProgram(vertexShader, fragmentShader);
            this.detectAttributes();
            this.detectUniforms();
        }

        public get name(): string {
            return this._name;
        }

        public getAttributeLocation(name: string): number {
            if (this._attributes[name] === undefined) {
                throw new Error(`Unable to find attribute '${name}' in shader '${this._name}'`);
            }

            return this._attributes[name];
        }

        public getUniformLocation(name: string): WebGLUniformLocation {
            if (this._uniforms[name] === undefined) {
                throw new Error(`Unable to find uniform '${name}' in shader '${this._name}'`);
            }

            return this._uniforms[name];
        }

        public use(): void {
            gl.useProgram(this._program);
        }

        private loadShader(source: string, shaderType: number): WebGLShader {
            let shader: WebGLShader = gl.createShader(shaderType);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            let shaderInfoLog = gl.getShaderInfoLog(shader);
            if (shaderInfoLog !== "") {
                throw new Error(`Error compiling shader '${this._name}': '${shaderInfoLog}'`);
            }

            return shader;
        }

        private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): void {
            this._program = gl.createProgram();

            gl.attachShader(this._program, vertexShader);
            gl.attachShader(this._program, fragmentShader);
            gl.linkProgram(this._program);

            let programInfoLog = gl.getProgramInfoLog(this._program);
            if (programInfoLog !== "") {
                throw new Error(`Error linking shader '${this._name}': ${programInfoLog}'`);
            }
        }

        private detectAttributes(): void {
            let attributeCount = gl.getProgramParameter(this._program, gl.ACTIVE_ATTRIBUTES);
            for (let i = 0; i < attributeCount; i++) {
                let attribute: WebGLActiveInfo = gl.getActiveAttrib(this._program, i);
                if (!attribute) {
                    break;
                }

                this._attributes[attribute.name] = gl.getAttribLocation(this._program, attribute.name);
            }
        }

        private detectUniforms(): void {
            let uniformCount = gl.getProgramParameter(this._program, gl.ACTIVE_UNIFORMS);
            for (let i = 0; i < uniformCount; i++) {
                let uniform: WebGLActiveInfo = gl.getActiveUniform(this._program, i);
                if (!uniform) {
                    break;
                }

                this._uniforms[uniform.name] = gl.getUniformLocation(this._program, uniform.name);
            }
        }
    }
}