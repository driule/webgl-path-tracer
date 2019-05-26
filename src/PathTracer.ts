import { gl } from "./gl/GLUtilities";
import { Scene } from "./Scene";
import { GLBuffer, AttributeInformation } from "./gl/GLBuffer";
import { Shader } from "./gl/Shader";

export class PathTracer {

    private _canvas: HTMLCanvasElement;
    private _scene: Scene;

    private _vertexBuffer: GLBuffer;
    private _framebuffer: WebGLBuffer;

    private _textures: WebGLTexture[];

    private _renderShader: Shader;
    private _tracerShader: Shader;

    private _sampleCount: number;

    public constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        // create framebuffer
        this._framebuffer = gl.createFramebuffer();
    
        // create textures
        var type = gl.getExtension("OES_texture_float") ? gl.FLOAT : gl.UNSIGNED_BYTE;
        this._textures = [];
        for (var i = 0; i < 2; i++) {
            this._textures.push(gl.createTexture());
            gl.bindTexture(gl.TEXTURE_2D, this._textures[i]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this._canvas.width, this._canvas.height, 0, gl.RGB, type, null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    
        // create shaders
        this._tracerShader = new Shader("tracer", require("./shaders/tracer.vertex.glsl"), require("./shaders/tracer.fragment.glsl"));
        this._renderShader = new Shader("render", require("./shaders/render.vertex.glsl"), require("./shaders/render.fragment.glsl"));

        let renderVertexAttribute = new AttributeInformation();
        renderVertexAttribute.location = this._renderShader.getAttributeLocation("vertex");
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
    }

    public render(timeSinceStart: number): void {
        this.update(timeSinceStart);
        this._renderShader.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, this._textures[0]);
        
        this._vertexBuffer.draw();
    }

    public setScene(scene: Scene): void {
        this._scene = scene;
        this.setShaderGeometry();
        this.restart();
    }
    
    public restart(): void {
        this._sampleCount = 0;
    }
    
    private update(timeSinceStart: number): void {
        let uniforms: any = {};
        uniforms.eye = this._scene.camera.eye;
        uniforms.ray00 = this._scene.camera.getEyeRay(-1, -1);
        uniforms.ray01 = this._scene.camera.getEyeRay(-1, +1);
        uniforms.ray10 = this._scene.camera.getEyeRay(+1, -1);
        uniforms.ray11 = this._scene.camera.getEyeRay(+1, +1);
        uniforms.timeSinceStart = timeSinceStart;
        uniforms.textureWeight = this._sampleCount / (this._sampleCount + 1);
        
        this._tracerShader.use();
        this._tracerShader.setUniforms(uniforms);

        // render to texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._textures[0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._textures[1], 0);

        this._vertexBuffer.upload();
        this._vertexBuffer.draw();
        
        // ping pong textures
        this._textures.reverse();
        this._sampleCount++;
    }
    
    private setShaderGeometry(): void {
        let uniforms: any = {};

        uniforms.resolution = [this._canvas.width, this._canvas.height];
        uniforms.textureWeight = this._sampleCount / (this._sampleCount + 1);

        // triangle data
        uniforms.triangles = this._scene.triangles;
        uniforms.totalTriangles = this._scene.triangles.length;
        uniforms.triangleDataTextureSize = Math.ceil(Math.sqrt(this._scene.triangles.length * 5));

        // BVH data
        uniforms.bvhNodeList = this._scene.bvh.nodeStack;
        uniforms.totalBvhNodes = uniforms.bvhNodeList.length;

        // {min}, {max}, {isLeaf, first, count}, {leftID, rightID, ID} - 4 rgb units
        uniforms.bvhDataTextureSize = Math.ceil(Math.sqrt(this._scene.bvh.nodeStack.length * 4));

        uniforms.triangleIndices = this._scene.bvh.triangleIndices;
        uniforms.triangleIndicesDataTextureSize = Math.ceil(Math.sqrt(uniforms.triangleIndices.length));

        // light data
        uniforms.lights = this._scene.lights;
        uniforms.totalLights = this._scene.lights.length;
        uniforms.lightDataTextureSize = Math.ceil(Math.sqrt(this._scene.lights.length * 2));

        // texturing
        if (this._scene.textureImage != undefined) {
            uniforms.textureImage = this._scene.textureImage;
        }

        // skydome
        if (this._scene.skydome != undefined) {
            uniforms.skydome = this._scene.skydome;
            uniforms.skydomeTextureSize = 2048;//Math.ceil(Math.sqrt(this._scene.skydome.data.length) * 3);
            uniforms.skydomeWidth = this._scene.skydome.shape[0];
            uniforms.skydomeHeight = this._scene.skydome.shape[1];
        }
        
        this._tracerShader.use();
        this._tracerShader.setUniforms(uniforms);
    }
}
