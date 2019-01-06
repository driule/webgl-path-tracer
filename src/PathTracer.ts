namespace LH {

    export class PathTracer {

        private vertexBuffer: GLBuffer;
        private framebuffer: WebGLBuffer;

        private textures: WebGLTexture[];

        private renderShader: Shader;
        private tracerShader: Shader;

        private sampleCount: number;

        private spheres: Sphere[];
        private light: Light;

        public constructor() {
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
            this.spheres = [];
            this.light = null;
            this.sampleCount = 0;
            this.tracerShader = null;
        }

        public setObjects(spheres: Sphere[], light: Light): void {
            this.sampleCount = 0;
            this.spheres = spheres;
            this.light = light;
          
            // create tracer shader
            if (this.tracerShader != null) {
                this.tracerShader.delete();
            }

            this.tracerShader = new Shader('tracer', tracerVertexSource, tracerFragmentSource);
        }
          
        public update(matrix, timeSinceStart: number, eye): void {
            
            // calculate uniforms
            let uniforms: any = {};
            uniforms.eye = eye;
            uniforms.ray00 = this.getEyeRay(matrix, -1, -1, eye);
            uniforms.ray01 = this.getEyeRay(matrix, -1, +1, eye);
            uniforms.ray10 = this.getEyeRay(matrix, +1, -1, eye);
            uniforms.ray11 = this.getEyeRay(matrix, +1, +1, eye);
            uniforms.timeSinceStart = timeSinceStart;
            uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);

            // light uniforms
            uniforms.light = this.light._position;

            // spheres uniforms
            uniforms.totalSpheres = this.spheres.length;
            uniforms.spheres = this.spheres;
          
            // set uniforms
            this.tracerShader.use();
            this.tracerShader.setUniforms(uniforms);
          
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

        private getEyeRay(matrix, x: number, y: number, eye): any {
            let transformedVector = glMatrix.vec4.transformMat4([], [x, y, 0, 1], matrix);
            let scaledVector = glMatrix.vec4.scale([], transformedVector, 1.00 / transformedVector[3]);

            return glMatrix.vec3.subtract([], [scaledVector[0], scaledVector[1], scaledVector[2]], eye);
        }
    }
}