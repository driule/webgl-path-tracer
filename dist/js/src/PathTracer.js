var LH;
(function (LH) {
    var PathTracer = /** @class */ (function () {
        function PathTracer(canvas) {
            this._canvas = canvas;
            // create framebuffer
            this._framebuffer = LH.gl.createFramebuffer();
            // create textures
            var type = LH.gl.getExtension('OES_texture_float') ? LH.gl.FLOAT : LH.gl.UNSIGNED_BYTE;
            this._textures = [];
            for (var i = 0; i < 2; i++) {
                this._textures.push(LH.gl.createTexture());
                LH.gl.bindTexture(LH.gl.TEXTURE_2D, this._textures[i]);
                LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB, this._canvas.width, this._canvas.height, 0, LH.gl.RGB, type, null);
            }
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, null);
            // create shaders
            this._tracerShader = new LH.Shader('tracer', loadFile('shaders/tracer.vertex.glsl'), loadFile('shaders/tracer.fragment.glsl'));
            this._renderShader = new LH.Shader('render', loadFile('shaders/render.vertex.glsl'), loadFile('shaders/render.fragment.glsl'));
            var renderVertexAttribute = new LH.AttributeInformation();
            renderVertexAttribute.location = this._renderShader.getAttributeLocation('vertex');
            renderVertexAttribute.offset = 0;
            renderVertexAttribute.size = 2;
            this._vertexBuffer = new LH.GLBuffer(2, LH.gl.FLOAT, LH.gl.ARRAY_BUFFER, LH.gl.TRIANGLE_STRIP);
            this._vertexBuffer.pushBackData([
                -1, -1,
                -1, +1,
                +1, -1,
                +1, +1
            ]);
            this._vertexBuffer.addAttributeLocation(renderVertexAttribute);
        }
        PathTracer.prototype.update = function (timeSinceStart) {
            // calculate uniforms
            var uniforms = {};
            uniforms.resolution = [this._canvas.width, this._canvas.height];
            uniforms.eye = this._scene.camera.eye;
            uniforms.ray00 = this._scene.camera.getEyeRay(-1, -1);
            uniforms.ray01 = this._scene.camera.getEyeRay(-1, +1);
            uniforms.ray10 = this._scene.camera.getEyeRay(+1, -1);
            uniforms.ray11 = this._scene.camera.getEyeRay(+1, +1);
            uniforms.timeSinceStart = timeSinceStart;
            uniforms.textureWeight = this._sampleCount / (this._sampleCount + 1);
            // triangle data
            uniforms.triangles = this._scene.triangles;
            uniforms.totalTriangles = this._scene.triangles.length;
            uniforms.triangleDataTextureSize = Math.ceil(Math.sqrt(this._scene.triangles.length * 3));
            // BVH data
            uniforms.bvhNodeList = this._scene.bvh.nodeStack;
            uniforms.totalBvhNodes = uniforms.bvhNodeList.length;
            // {min}, {max}, {isLeaf, first, count}, {left, right, 0} - 4 rgb units
            uniforms.bvhDataTextureSize = Math.ceil(Math.sqrt(this._scene.bvh.nodeStack.length * 4));
            uniforms.triangleIndices = this._scene.bvh.triangleIndices;
            uniforms.triangleIndicesDataTextureSize = Math.ceil(Math.sqrt(uniforms.triangleIndices.length));
            // light data
            uniforms.lights = this._scene.lights;
            uniforms.totalLights = this._scene.lights.length;
            uniforms.lightDataTextureSize = Math.ceil(Math.sqrt(this._scene.lights.length * 2));
            // set uniforms
            this._tracerShader.use();
            // render to texture
            LH.gl.activeTexture(LH.gl.TEXTURE0);
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this._textures[0]);
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, this._framebuffer);
            LH.gl.framebufferTexture2D(LH.gl.FRAMEBUFFER, LH.gl.COLOR_ATTACHMENT0, LH.gl.TEXTURE_2D, this._textures[1], 0);
            this._tracerShader.setUniforms(uniforms);
            this._vertexBuffer.upload();
            this._vertexBuffer.draw();
            // ping pong textures
            this._textures.reverse();
            this._sampleCount++;
        };
        PathTracer.prototype.render = function () {
            this._renderShader.use();
            LH.gl.bindFramebuffer(LH.gl.FRAMEBUFFER, null);
            LH.gl.bindTexture(LH.gl.TEXTURE_2D, this._textures[0]);
            this._vertexBuffer.draw();
        };
        PathTracer.prototype.setScene = function (scene) {
            this._scene = scene;
            this.restart();
        };
        PathTracer.prototype.restart = function () {
            this._sampleCount = 0;
        };
        return PathTracer;
    }());
    LH.PathTracer = PathTracer;
})(LH || (LH = {}));
//# sourceMappingURL=PathTracer.js.map