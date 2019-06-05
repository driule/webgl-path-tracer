import { gl } from "./gl/GLUtilities";
import { Scene } from "./Scene";
import { GLBuffer, AttributeInformation } from "./gl/GLBuffer";
import { Shader } from "./gl/Shader";

export class PathTracer {

    private canvas: HTMLCanvasElement;
    private scene: Scene;

    private vertexBuffer: GLBuffer;
    private frameBuffer: WebGLBuffer;

    private outputTextures: WebGLTexture[];

    private renderShader: Shader;
    private tracerShader: Shader;

    private sampleCount: number;

    public constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // create output textures
        var type = gl.getExtension("OES_texture_float") ? gl.FLOAT : gl.UNSIGNED_BYTE;
        this.outputTextures = [];
        for (var i = 0; i < 2; i++) {
            this.outputTextures.push(gl.createTexture());
            gl.bindTexture(gl.TEXTURE_2D, this.outputTextures[i]);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, this.canvas.width, this.canvas.height, 0, gl.RGB, type, null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
    
        // create shaders
        this.tracerShader = new Shader("tracer", require("./shaders/tracer.vertex.glsl"), require("./shaders/tracer.fragment.glsl"));
        this.renderShader = new Shader("render", require("./shaders/render.vertex.glsl"), require("./shaders/render.fragment.glsl"));

        // create buffers
        this.frameBuffer = gl.createFramebuffer();
        
        let renderVertexAttribute = new AttributeInformation();
        renderVertexAttribute.location = this.renderShader.getAttributeLocation("vertex");
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
    }

    public render(timeSinceStart: number): void {
        this.update(timeSinceStart);
        this.renderShader.use();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTextures[0]);
        
        this.vertexBuffer.draw();
    }
    
    private update(timeSinceStart: number): void {
        let uniforms: any = {};
        uniforms.eye = this.scene.getCamera().getPosition();
        uniforms.ray00 = this.scene.getCamera().getRay(-1, -1);
        uniforms.ray01 = this.scene.getCamera().getRay(-1, +1);
        uniforms.ray10 = this.scene.getCamera().getRay(+1, -1);
        uniforms.ray11 = this.scene.getCamera().getRay(+1, +1);
        uniforms.timeSinceStart = timeSinceStart;
        uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);
        
        // render to texture
        this.tracerShader.use();
        this.tracerShader.setUniforms(uniforms);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTextures[0]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTextures[1], 0);

        this.vertexBuffer.upload();
        this.vertexBuffer.draw();
        
        // ping pong output textures
        this.outputTextures.reverse();
        this.sampleCount++;
    }
    
    public restart(): void {
        this.sampleCount = 0;
    }

    public setScene(scene: Scene): void {
        this.scene = scene;
        this.setShaderGeometry();
        this.restart();
    }
    
    private setShaderGeometry(): void {
        let uniforms: any = {};

        uniforms.resolution = [this.canvas.width, this.canvas.height];
        uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);

        // materials
        uniforms.materials = this.scene.getMaterials();
        uniforms.materialsTextureSize = 512;//Math.ceil(Math.sqrt(uniforms.materials.length * 2));

        // triangle data
        uniforms.triangles = this.scene.getTriangles();
        uniforms.triangleIndices = this.scene.getBVH().getTriangleIndices();
        uniforms.triangleDataTextureSize = 4096;//Math.ceil(Math.sqrt(uniforms.triangles.length * 6));

        // BVH data
        uniforms.bvhNodeList = this.scene.getBVH().getNodeList();

        // {min}, {max}, {isLeaf, first, count}, {leftID, rightID, ID} - 4 rgb units
        uniforms.bvhDataTextureSize = 2048;//Math.ceil(Math.sqrt(this.scene.bvh.nodeStack.length * 4));

        // light data
        uniforms.lights = this.scene.getLights();
        uniforms.totalLights = uniforms.lights.length;
        uniforms.lightDataTextureSize = 512;//Math.ceil(Math.sqrt(this.scene.lights.length * 2));

        // skydome
        uniforms.isSkydomeLoaded = false;
        if (this.scene.skydome != undefined) {
            uniforms.isSkydomeLoaded = true;
            uniforms.skydome = this.scene.skydome;
            uniforms.skydomeTextureSize = Math.ceil(Math.sqrt(this.scene.skydome.shape[0] * this.scene.skydome.shape[1] * 3));
            uniforms.skydomeWidth = this.scene.skydome.shape[0];
            uniforms.skydomeHeight = this.scene.skydome.shape[1];
        }
        
        this.tracerShader.use();
        this.tracerShader.setUniforms(uniforms);
    }
}
