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
                console.log('boom');
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

        // TODO: this is very badly harcoded way to set uniforms
        public setUniforms(uniforms): void {
            for (let name in uniforms) {

                // specific case for spheres
                if (name.toString() === "spheres") {
                    for (let i = 0; i < uniforms.spheres.length; i++) {
                        let centerLocation = gl.getUniformLocation(this._program, "spheres[" + i + "].center");
                        gl.uniform3fv(centerLocation, new Float32Array([uniforms.spheres[i].center[0], uniforms.spheres[i].center[1], uniforms.spheres[i].center[2]]));

                        let radiusLocation = gl.getUniformLocation(this._program, "spheres[" + i + "].radius");
                        gl.uniform1f(radiusLocation, uniforms.spheres[i].radius);
                    }
                    continue;
                }

                // specific case for light
                if (name.toString() === "light") {
                    let centerLocation = gl.getUniformLocation(this._program, "light.position");
                    gl.uniform3fv(centerLocation, new Float32Array([uniforms.light.position[0], uniforms.light.position[1], uniforms.light.position[2]]));

                    let radiusLocation = gl.getUniformLocation(this._program, "light.radius");
                    gl.uniform1f(radiusLocation, uniforms.light.radius);

                    let intensityLocation = gl.getUniformLocation(this._program, "light.intensity");
                    gl.uniform1f(intensityLocation, uniforms.light.intensity);
                    continue;
                }

                // specific case for triangles
                if (name.toString() === "triangle") {
                    let aLocation = gl.getUniformLocation(this._program, "triangle.a");
                    gl.uniform3fv(aLocation, new Float32Array([uniforms.triangle.a[0], uniforms.triangle.a[1], uniforms.triangle.a[2]]));
                    
                    let bLocation = gl.getUniformLocation(this._program, "triangle.b");
                    gl.uniform3fv(bLocation, new Float32Array([uniforms.triangle.b[0], uniforms.triangle.b[1], uniforms.triangle.b[2]]));
                    
                    let cLocation = gl.getUniformLocation(this._program, "triangle.c");
                    gl.uniform3fv(cLocation, new Float32Array([uniforms.triangle.c[0], uniforms.triangle.c[1], uniforms.triangle.c[2]]));

                    continue;
                }

                let location = gl.getUniformLocation(this._program, name);
                if (location == null) continue;

                var vector3Uniforms = [
                    "eye",
                    "ray00",
                    "ray01",
                    "ray11",
                    "ray10",
                    "light"
                ];
                var matrix4Uniforms = [
                ];
                var intUniforms = [
                    "totalSpheres"
                ];
                var floatUniforms = [
                    "timeSinceStart",
                    "textureWeight"
                ];
        
                let value = uniforms[name];
                if (vector3Uniforms.indexOf(name) > -1) {
                    gl.uniform3fv(location, new Float32Array([value[0], value[1], value[2]]));
                } else if (matrix4Uniforms.indexOf(name) > -1) {
                    gl.uniformMatrix4fv(location, false, new Float32Array(value.flatten()));
                } else if (intUniforms.indexOf(name) > -1) {
                    gl.uniform1i(location, value);
                } else if (floatUniforms.indexOf(name) > -1) {
                    gl.uniform1f(location, value);
                }
            }
        }

        public use(): void {
            gl.useProgram(this._program);
        }

        public delete(): void {
            gl.deleteProgram(this._program);
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