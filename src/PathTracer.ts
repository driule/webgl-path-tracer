namespace LH {

    export class PathTracer {

        private _resolution: any;

        private _vertexBuffer: GLBuffer;
        private _framebuffer: WebGLBuffer;

        private _textures: WebGLTexture[];

        private _renderShader: Shader;
        private _tracerShader: Shader;

        private _sampleCount: number;

        private _spheres: Sphere[];
        private _triangles: Triangle[];
        private _light: Light;

        public constructor(resolution: any) {
            this._resolution = resolution;

            // create framebuffer
            this._framebuffer = gl.createFramebuffer();
        
            // create textures
            var type = gl.getExtension('OES_texture_float') ? gl.FLOAT : gl.UNSIGNED_BYTE;
            // console.log('type: ' + type);
            this._textures = [];
            for (var i = 0; i < 2; i++) {
                this._textures.push(gl.createTexture());
                gl.bindTexture(gl.TEXTURE_2D, this._textures[i]);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this._resolution[0], this._resolution[1], 0, gl.RGB, type, null);
            }
            gl.bindTexture(gl.TEXTURE_2D, null);
        
            // create shaders
            this._tracerShader = new Shader('tracer', tracerVertexSource, tracerFragmentSource);
            this._renderShader = new Shader('render', renderVertexSource, renderFragmentSource);

            let renderVertexAttribute = new AttributeInformation();
            renderVertexAttribute.location = this._renderShader.getAttributeLocation('vertex');
            renderVertexAttribute.offset = 0;
            renderVertexAttribute.size = 2;

            this._vertexBuffer = new GLBuffer(2, gl.FLOAT, gl.ARRAY_BUFFER, gl.TRIANGLE_STRIP);
            this._vertexBuffer.pushBackData([
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ]);
            this._vertexBuffer.addAttributeLocation(renderVertexAttribute);
        
            this._light = null;
            this._spheres = [];
            this._triangles = [];
        }
          
        public update(viewProjectionMatrix: any, timeSinceStart: number, eye: any): void {
            
            // jitter view-projection matrix for anti-aliasing
            let jitterVector = [(Math.random() * 2 - 1) / this._resolution[0], (Math.random() * 2 - 1) / this._resolution[1], 0];
            viewProjectionMatrix = glMatrix.mat4.translate([], viewProjectionMatrix, jitterVector);

            // calculate uniforms
            let uniforms: any = {};
            uniforms.resolution = this._resolution;
            uniforms.eye = eye;
            uniforms.ray00 = this.getEyeRay(viewProjectionMatrix, -1, -1, eye);
            uniforms.ray01 = this.getEyeRay(viewProjectionMatrix, -1, +1, eye);
            uniforms.ray10 = this.getEyeRay(viewProjectionMatrix, +1, -1, eye);
            uniforms.ray11 = this.getEyeRay(viewProjectionMatrix, +1, +1, eye);
            uniforms.timeSinceStart = timeSinceStart;
            uniforms.textureWeight = this._sampleCount / (this._sampleCount + 1);

            uniforms.light = this._light;
            uniforms.spheres = this._spheres;
            uniforms.totalSpheres = this._spheres.length;
            // uniforms.triangles = this._triangles;
            uniforms.totalTriangles = this._triangles.length;
            // console.log('total triangles: ' + uniforms.totalTriangles);

            // ToDo:
            uniforms.triangleDataTextureSize = 256;
            uniforms.triangleData = this._triangles;
          
            // set uniforms
            this._tracerShader.use();

            // render to texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this._textures[0]);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._textures[1], 0);

            this._tracerShader.setUniforms(uniforms);

            this._vertexBuffer.upload();
            this._vertexBuffer.draw();
          
            // ping pong textures
            this._textures.reverse();
            this._sampleCount++;
        }

        public render(): void {
            this._renderShader.use();

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, this._textures[0]);
            
            this._vertexBuffer.draw();
        }

        public setObjects(spheres: Sphere[], triangles: Triangle[], light: Light): void {
            this._spheres = spheres;
            this._triangles = triangles;
            this._light = light;

            this.restart();
        }
        
        public restart(): void {
            this._sampleCount = 0;
        }
        
        private getEyeRay(matrix: any, x: number, y: number, eye: any): any {
            let transformedVector = glMatrix.vec4.transformMat4([], [x, y, 0, 1], matrix);
            let scaledVector = glMatrix.vec4.scale([], transformedVector, 1.00 / transformedVector[3]);

            return glMatrix.vec3.subtract([], [scaledVector[0], scaledVector[1], scaledVector[2]], eye);
        }
    }
}