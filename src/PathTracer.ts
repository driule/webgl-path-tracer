namespace LH {

    export class PathTracer {

        private vertexBuffer: GLBuffer;
        private framebuffer: WebGLBuffer;

        private textures: WebGLTexture[];

        private renderShader: Shader;
        private tracerShader: Shader;

        private tracerVertexAttribute: number;
        private sampleCount: number;

        private objects;
        public uniforms: {[name: string]: WebGLUniformLocation} = {};

        public constructor() {        
            // create framebuffer
            this.framebuffer = gl.createFramebuffer();
            //this.framebuffer = new GLBuffer(2);
        
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

            let renderVertexAttribute = new AttributeInformation();
            renderVertexAttribute.location = this.renderShader.getAttributeLocation('vertex');
            renderVertexAttribute.offset = 0;
            renderVertexAttribute.size = 2;

            this.vertexBuffer = new GLBuffer(2, gl.FLOAT, gl.ARRAY_BUFFER, gl.TRIANGLE_STRIP);
            this.vertexBuffer.pushBackData([
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ]);
            this.vertexBuffer.addAttributeLocation(renderVertexAttribute);
        
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
            //this.tracerVertexAttribute = this.tracerShader.getAttributeLocation('vertex');
            //gl.enableVertexAttribArray(this.tracerVertexAttribute);
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
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1], 0);

            this.vertexBuffer.upload();
            this.vertexBuffer.draw();
          
            // ping pong textures
            this.textures.reverse();
            this.sampleCount++;
        }

        public render(): void {
            this.renderShader.use();

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
            
            this.vertexBuffer.draw();
        }

        private getEyeRay(matrix, x, y, eye): Matrix {
            return matrix.multiply(Vector.create([x, y, 0, 1])).divideByW().ensure3().subtract(eye);
        }
    }
}