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

        // TODO: this is very badly harcoded way to set uniforms
        public setUniforms(uniforms): void {
            for (let name in uniforms) {

                // specific case for triangle data texture
                if (name.toString() === "triangles") {

                    let triangleList = new Float32Array(uniforms.triangleDataTextureSize * uniforms.triangleDataTextureSize * 3);
                    for (let i = 0; i < uniforms.totalTriangles; i++) {
                        triangleList[i * 3 * 3 + 0] = uniforms.triangles[i].a[0];
                        triangleList[i * 3 * 3 + 1] = uniforms.triangles[i].a[1];
                        triangleList[i * 3 * 3 + 2] = uniforms.triangles[i].a[2];

                        triangleList[i * 3 * 3 + 3] = uniforms.triangles[i].b[0];
                        triangleList[i * 3 * 3 + 4] = uniforms.triangles[i].b[1];
                        triangleList[i * 3 * 3 + 5] = uniforms.triangles[i].b[2];

                        triangleList[i * 3 * 3 + 6] = uniforms.triangles[i].c[0];
                        triangleList[i * 3 * 3 + 7] = uniforms.triangles[i].c[1];
                        triangleList[i * 3 * 3 + 8] = uniforms.triangles[i].c[2];
                    }

                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, uniforms.triangleDataTextureSize, uniforms.triangleDataTextureSize, 0, gl.RGB, gl.FLOAT, triangleList);
                    
                    let triangleDataLocation = gl.getUniformLocation(this._program, "triangleDataTexture");
                    gl.uniform1i(triangleDataLocation, 1);

                    continue;
                }

                // specific case for light
                if (name.toString() === "lights") {
                    let lightList = new Float32Array(uniforms.lightDataTextureSize * uniforms.lightDataTextureSize * 3);
                    for (let i = 0; i < uniforms.totalLights; i++) {
                        lightList[i * 3 * 3 + 0] = uniforms.lights[i].position[0];
                        lightList[i * 3 * 3 + 1] = uniforms.lights[i].position[1];
                        lightList[i * 3 * 3 + 2] = uniforms.lights[i].position[2];

                        lightList[i * 3 * 3 + 3] = uniforms.lights[i].radius;
                        lightList[i * 3 * 3 + 4] = uniforms.lights[i].intensity;
                        lightList[i * 3 * 3 + 5] = 0.0;
                    }

                    gl.activeTexture(gl.TEXTURE2);
                    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, uniforms.lightDataTextureSize, uniforms.lightDataTextureSize, 0, gl.RGB, gl.FLOAT, lightList);
                    
                    let lightDataLocation = gl.getUniformLocation(this._program, "lightDataTexture");
                    gl.uniform1i(lightDataLocation, 2);

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
                var vector2Uniforms = [
                    "resolution"
                ];
                var matrix4Uniforms = [
                ];
                var intUniforms = [
                    "totalTriangles"
                ];
                var floatUniforms = [
                    "timeSinceStart",
                    "textureWeight",
                    "triangleDataTextureSize",
                    "lightDataTextureSize"
                ];
        
                let value = uniforms[name];
                if (vector2Uniforms.indexOf(name) > -1) {
                    gl.uniform2fv(location, new Float32Array([value[0], value[1]]));
                } else if (vector3Uniforms.indexOf(name) > -1) {
                    gl.uniform3fv(location, new Float32Array([value[0], value[1], value[2]]));
                } else if (matrix4Uniforms.indexOf(name) > -1) {
                    // TODO: implement matrix uniform support
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