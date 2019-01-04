namespace LH {

    export class PathTracer {

        private vertexBuffer: WebGLBuffer;
        private framebuffer: WebGLBuffer;

        private textures: WebGLTexture[];

        private renderShader: Shader;
        private tracerShader: Shader;

        private renderVertexAttribute: number;
        private tracerVertexAttribute: number;
        private sampleCount: number;

        private objects;
        public uniforms;

        public constructor() {
            var vertices = [
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ];
            
            // create vertex buffer
            this.vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
            // create framebuffer
            this.framebuffer = gl.createFramebuffer();
        
            // create textures
            var type = gl.getExtension('OES_texture_float') ? gl.FLOAT : gl.UNSIGNED_BYTE;
            this.textures = [];
            for (var i = 0; i < 2; i++) {
                this.textures.push(gl.createTexture());
                gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 512, 512, 0, gl.RGB, type, null);
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
        
            // create render shader
            this.renderShader = new Shader('render', renderVertexSource, renderFragmentSource);
            this.renderVertexAttribute = this.renderShader.getAttributeLocation('vertex');
            gl.enableVertexAttribArray(this.renderVertexAttribute);
        
            // objects and shader will be filled in when setObjects() is called
            this.objects = [];
            this.sampleCount = 0;
            this.tracerShader = null;
        }

        public setObjects(objects): void {
            this.uniforms = {};
            this.sampleCount = 0;
            this.objects = objects;
          
            // create tracer shader
            if(this.tracerShader != null) {
                this.tracerShader.delete();
            }
            this.tracerShader = new Shader('tracer', tracerVertexSource, makeTracerFragmentSource(objects));
            this.tracerVertexAttribute = this.tracerShader.getAttributeLocation('vertex');
            gl.enableVertexAttribArray(this.tracerVertexAttribute);
        }
          
        public update(matrix: Matrix, timeSinceStart: number, eye: Vector): void {
            // calculate uniforms
            for(var i = 0; i < this.objects.length; i++) {
              this.objects[i].setUniforms(this);
            }
            this.uniforms.eye = eye;
            this.uniforms.glossiness = glossiness;
            this.uniforms.ray00 = this.getEyeRay(matrix, -1, -1, eye);
            this.uniforms.ray01 = this.getEyeRay(matrix, -1, +1, eye);
            this.uniforms.ray10 = this.getEyeRay(matrix, +1, -1, eye);
            this.uniforms.ray11 = this.getEyeRay(matrix, +1, +1, eye);
            this.uniforms.timeSinceStart = timeSinceStart;
            this.uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);
          
            // set uniforms
            this.tracerShader.use();
            this.tracerShader.setUniforms(this.uniforms);
          
            // render to texture
            this.tracerShader.use();
            gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1], 0);
            gl.vertexAttribPointer(this.tracerVertexAttribute, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          
            // ping pong textures
            this.textures.reverse();
            this.sampleCount++;
        }

        public render(): void {
            this.renderShader.use();

            gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.vertexAttribPointer(this.renderVertexAttribute, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        private getEyeRay(matrix, x, y, eye): Matrix {
            return matrix.multiply(Vector.create([x, y, 0, 1])).divideByW().ensure3().subtract(eye);
        }
    }
}