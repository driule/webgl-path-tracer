import { gl } from "./GLUtilities";
import { Material } from "../geometry/Material";
import { Triangle } from "../geometry/Triangle";
import { Light } from "../geometry/Light";
import { BoundingBox } from "../geometry/BoundingBox";
import { Skydome } from "../geometry/Skydome";

export enum ShaderDataType {
    int,
    float,
    vec2,
    vec3
}

export class Shader {

    private name: string;
    private program: WebGLProgram;
    private attributes: {[name: string]: number} = {};
    private uniforms: {[name: string]: WebGLUniformLocation} = {};

    public constructor(name: string, vertexSource: string, fragmentSource: string) {
        this.name = name;

        let vertexShader = this.loadShader(vertexSource, gl.VERTEX_SHADER);
        let fragmentShader = this.loadShader(fragmentSource, gl.FRAGMENT_SHADER);

        this.createProgram(vertexShader, fragmentShader);
        this.detectAttributes();
        this.detectUniforms();
    }

    public getAttributeLocation(name: string): number {
        if (this.attributes[name] === undefined) {
            throw new Error(`Unable to find attribute "${name}" in shader "${this.name}"`);
        }

        return this.attributes[name];
    }

    public getUniformLocation(name: string): WebGLUniformLocation {
        if (this.uniforms[name] === undefined) {
            throw new Error(`Unable to find uniform "${name}" in shader "${this.name}"`);
        }

        return this.uniforms[name];
    }

    public setUniforms(uniforms: any): void {
        for (let name in uniforms) {

            let location = gl.getUniformLocation(this.program, name);
            if (location == null) continue;
    
            let value = uniforms[name][0];
            let type = uniforms[name][1];

            if (type == ShaderDataType.int) {
                gl.uniform1i(location, value);
            } else if (type == ShaderDataType.float) {
                gl.uniform1f(location, value);
            } else if (type == ShaderDataType.vec2) {
                gl.uniform2fv(location, new Float32Array([value[0], value[1]]));
            } else if (type == ShaderDataType.vec3) {
                gl.uniform3fv(location, new Float32Array([value[0], value[1], value[2]]));
            }
        }
    }

    public setTriangleData(triangles: Triangle[], triangleIndices: number[]) {
        const textureSize = Math.min(gl.MAX_TEXTURE_SIZE, 2048.0);
        let triangleList = new Float32Array(textureSize * textureSize * 3);
        for (let i = 0; i < triangles.length; i++) {
            let triangle: Triangle = triangles[i];

            triangleList[i * 3 * 6 + 0] = triangle.getA()[0];
            triangleList[i * 3 * 6 + 1] = triangle.getA()[1];
            triangleList[i * 3 * 6 + 2] = triangle.getA()[2];

            triangleList[i * 3 * 6 + 3] = triangle.getB()[0];
            triangleList[i * 3 * 6 + 4] = triangle.getB()[1];
            triangleList[i * 3 * 6 + 5] = triangle.getB()[2];

            triangleList[i * 3 * 6 + 6] = triangle.getC()[0];
            triangleList[i * 3 * 6 + 7] = triangle.getC()[1];
            triangleList[i * 3 * 6 + 8] = triangle.getC()[2];

            triangleList[i * 3 * 6 + 9] = triangle.getUvA()[0];
            triangleList[i * 3 * 6 + 10] = triangle.getUvA()[1];
            triangleList[i * 3 * 6 + 11] = triangle.getUvB()[0];
            
            triangleList[i * 3 * 6 + 12] = triangle.getUvB()[1];
            triangleList[i * 3 * 6 + 13] = triangle.getUvC()[0];
            triangleList[i * 3 * 6 + 14] = triangle.getUvC()[1];

            triangleList[i * 3 * 6 + 15] = triangle.getMaterial().getId();
            triangleList[i * 3 * 6 + 16] = triangleIndices[i];
            triangleList[i * 3 * 6 + 17] = 1.0;
        }

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, textureSize, textureSize, 0, gl.RGB, gl.FLOAT, triangleList);
        
        let triangleDataLocation = gl.getUniformLocation(this.program, "triangleDataTexture");
        gl.uniform1i(triangleDataLocation, 1);

        this.setUniforms({triangleDataTextureSize: [textureSize, ShaderDataType.float]});
    }

    public setLights(lights: Light[]) {
        const textureSize = Math.min(gl.MAX_TEXTURE_SIZE, 512.0);
        let lightList = new Float32Array(textureSize * textureSize * 3);
        for (let i = 0; i < lights.length; i++) {
            let light: Light = lights[i];

            lightList[i * 3 * 2 + 0] = light.getPosition()[0];
            lightList[i * 3 * 2 + 1] = light.getPosition()[1];
            lightList[i * 3 * 2 + 2] = light.getPosition()[2];

            lightList[i * 3 * 2 + 3] = light.getRadius();
            lightList[i * 3 * 2 + 4] = light.getIntensity();
            lightList[i * 3 * 2 + 5] = 1.0;
        }

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, textureSize, textureSize, 0, gl.RGB, gl.FLOAT, lightList);
        
        let lightDataLocation = gl.getUniformLocation(this.program, "lightDataTexture");
        gl.uniform1i(lightDataLocation, 2);

        this.setUniforms({
            lightDataTextureSize: [textureSize, ShaderDataType.float],
            totalLights: [lights.length, ShaderDataType.int]
        });
    }

    public setBvhData(bvhNodeList: BoundingBox[]) {
        const textureSize = Math.min(gl.MAX_TEXTURE_SIZE, 2048.0);
        let bvhNodeDataList = new Float32Array(textureSize * textureSize * 3);
        for (let i = 0; i < bvhNodeList.length; i++) {
            let bvhNode: BoundingBox = bvhNodeList[i];

            bvhNodeDataList[i * 3 * 4 + 0] = bvhNode.min[0];
            bvhNodeDataList[i * 3 * 4 + 1] = bvhNode.min[1];
            bvhNodeDataList[i * 3 * 4 + 2] = bvhNode.min[2];

            bvhNodeDataList[i * 3 * 4 + 3] = bvhNode.max[0];
            bvhNodeDataList[i * 3 * 4 + 4] = bvhNode.max[1];
            bvhNodeDataList[i * 3 * 4 + 5] = bvhNode.max[2];

            bvhNodeDataList[i * 3 * 4 + 6] = bvhNode.isLeaf ? 1 : 0;
            bvhNodeDataList[i * 3 * 4 + 7] = bvhNode.first;
            bvhNodeDataList[i * 3 * 4 + 8] = bvhNode.count;

            if (!bvhNode.isLeaf) {
                bvhNodeDataList[i * 3 * 4 + 9] = bvhNode.left.getId();
                bvhNodeDataList[i * 3 * 4 + 10] = bvhNode.right.getId();
            } else {
                bvhNodeDataList[i * 3 * 4 + 9] = 1.0;
                bvhNodeDataList[i * 3 * 4 + 10] = 1.0;
            }
            bvhNodeDataList[i * 3 * 4 + 11] = bvhNode.getId();
        }

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, textureSize, textureSize, 0, gl.RGB, gl.FLOAT, bvhNodeDataList);
        
        let bvhDataLocation = gl.getUniformLocation(this.program, "bvhDataTexture");
        gl.uniform1i(bvhDataLocation, 3);

        this.setUniforms({bvhDataTextureSize: [textureSize, ShaderDataType.float]});
    }

    public setMaterials(materials: Material[]) {
        const materialsTextureSize = Math.min(gl.MAX_TEXTURE_SIZE, 2048.0);
        const albedoTextureSize = Math.min(gl.MAX_TEXTURE_SIZE, 2048.0);
        
        console.log('actual albedo texture size:', albedoTextureSize);

        let albedoTexturePointer = 0;
        let albedoPixelOffset = 0;
        let albedoImageDataList: Float32Array[] = [];

        let materialList = new Float32Array(materialsTextureSize * materialsTextureSize * 3);
        for (let i = 0; i < materials.length; i++) {
            let material: Material = materials[i];

            materialList[i * 3 * 3 + 0] = material.getColor()[0];
            materialList[i * 3 * 3 + 1] = material.getColor()[1];
            materialList[i * 3 * 3 + 2] = material.getColor()[2];

            if (material.getAlbedoImageElement() != undefined) {
                materialList[i * 3 * 3 + 3] = 1.0; // texture defined flag set to TRUE
                materialList[i * 3 * 3 + 4] = albedoTexturePointer;
                materialList[i * 3 * 3 + 5] = albedoPixelOffset;
                // console.log('albedoPixelOffset: ', albedoPixelOffset * 3);

                materialList[i * 3 * 3 + 6] = material.getAlbedoImageElement().width;
                materialList[i * 3 * 3 + 7] = material.getAlbedoImageElement().height;
                materialList[i * 3 * 3 + 8] = 0.0;
                // console.log('current image size', material.getAlbedoImageElement().width, material.getAlbedoImageElement().height);

                albedoImageDataList.push(material.getAlbedoImageData());
                albedoPixelOffset += material.getAlbedoImageData().length / 3;

                // last material processed
                if ((i + 1) >= materials.length) {
                    // console.log('last flush', albedoTexturePointer);
                    this.setMaterialAlbedoTexture(albedoTexturePointer, albedoImageDataList, albedoTextureSize);
                    break;
                }

                // current texture fullfilled, flush data
                if (albedoPixelOffset * 3 + materials[i + 1].getAlbedoImageData().length > albedoTextureSize * albedoTextureSize * 3) {
                    // console.log('flush', albedoTexturePointer);
                    this.setMaterialAlbedoTexture(albedoTexturePointer, albedoImageDataList, albedoTextureSize);
                    albedoImageDataList = [];
                    albedoPixelOffset = 0;
                    albedoTexturePointer++;
                }
            } else {
                materialList[i * 3 * 3 + 3] = 0.0;
                materialList[i * 3 * 3 + 4] = 0.0;
                materialList[i * 3 * 3 + 5] = 0.0;

                materialList[i * 3 * 3 + 6] = 0.0;
                materialList[i * 3 * 3 + 7] = 0.0;
                materialList[i * 3 * 3 + 8] = 0.0;
            }
        }

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, materialsTextureSize, materialsTextureSize, 0, gl.RGB, gl.FLOAT, materialList);

        let materialsTextureLocation = gl.getUniformLocation(this.program, "materialsTexture");
        gl.uniform1i(materialsTextureLocation, 4);

        this.setUniforms({
            materialsTextureSize: [materialsTextureSize, ShaderDataType.float],
            albedoTextureSize: [albedoTextureSize, ShaderDataType.float]
        });
    }

    public setMaterialAlbedoTexture(id: number, imageDataList: Float32Array[], textureSize: number) {
        if (id >= 7) {
            console.log("Maximum 7 textures dedicated in the shader for albedo color!");
        }

        console.log('setting albedo texture', id);

        let rgbList = new Float32Array(textureSize * textureSize * 3);
        let offset = 0;
        for (let i = 0; i < imageDataList.length; i++) {
            let textureRgbList: Float32Array = imageDataList[i];

            for (let j = 0; j < textureRgbList.length; j++) {
                rgbList[offset] = textureRgbList[j];
                offset++;
            }
        }

        gl.activeTexture(gl.TEXTURE6 + id);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, textureSize, textureSize, 0, gl.RGB, gl.FLOAT, rgbList);

        let materialsTextureLocation = gl.getUniformLocation(this.program, "albedoTexture" + (id + 1));
        gl.uniform1i(materialsTextureLocation, 6 + id);
    }

    public setSkydome(skydome: Skydome) {
        const textureSize = Math.min(gl.MAX_TEXTURE_SIZE, 4048.0);
        console.log('actual skydome texture size:', textureSize);

        let rgbList = new Float32Array(textureSize * textureSize * 3);
        let counter = 0;
        let textureId = 0;
        let flushed = true;
        for (let i = 0; i < skydome.getWidth() * skydome.getHeight(); i++) {
            rgbList[counter * 3 + 0] = skydome.getData()[i * 4 + 0];
            rgbList[counter * 3 + 1] = skydome.getData()[i * 4 + 1];
            rgbList[counter * 3 + 2] = skydome.getData()[i * 4 + 2];
            counter++;

            if (counter * 3 >= rgbList.length) {
                this.setSkydomeTexture(textureId, rgbList, textureSize);
                rgbList = new Float32Array(textureSize * textureSize * 3);
                counter = 0;
                textureId++;
                flushed = true;
                continue;
            }
            flushed = false;
        }

        if (!flushed) {
            this.setSkydomeTexture(textureId, rgbList, textureSize);
        }

        this.setUniforms({
            skydomeTextureSize: [textureSize,ShaderDataType.float],
            skydomeWidth: [skydome.getWidth(), ShaderDataType.int],
            skydomeHeight: [skydome.getHeight(), ShaderDataType.int]
        });
    }

    public setSkydomeTexture(id: number, rgbList: Float32Array, textureSize: number) {
        if (id >= 4) {
            console.log("Maximum 4 textures dedicated in the shader for skydome!");
        }

        console.log('setting skydome texture', id);

        gl.activeTexture(gl.TEXTURE12 + id);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, textureSize, textureSize, 0, gl.RGB, gl.FLOAT, rgbList);

        let materialsTextureLocation = gl.getUniformLocation(this.program, "skydomeTexture" + (id + 1));
        gl.uniform1i(materialsTextureLocation, 12 + id);
    }

    public use(): void {
        gl.useProgram(this.program);
    }

    public delete(): void {
        gl.deleteProgram(this.program);
    }

    private loadShader(source: string, shaderType: number): WebGLShader {
        let shader: WebGLShader = gl.createShader(shaderType);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        let shaderInfoLog = gl.getShaderInfoLog(shader);
        if (shaderInfoLog !== "") {
            throw new Error(`Error compiling shader "${this.name}": "${shaderInfoLog}"`);
        }

        return shader;
    }

    private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): void {
        this.program = gl.createProgram();

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        let programInfoLog = gl.getProgramInfoLog(this.program);
        if (programInfoLog !== "") {
            throw new Error(`Error linking shader "${this.name}": ${programInfoLog}"`);
        }
    }

    private detectAttributes(): void {
        let attributeCount = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < attributeCount; i++) {
            let attribute: WebGLActiveInfo = gl.getActiveAttrib(this.program, i);
            if (!attribute) {
                break;
            }

            this.attributes[attribute.name] = gl.getAttribLocation(this.program, attribute.name);
        }
    }

    private detectUniforms(): void {
        let uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
            let uniform: WebGLActiveInfo = gl.getActiveUniform(this.program, i);
            if (!uniform) {
                break;
            }

            this.uniforms[uniform.name] = gl.getUniformLocation(this.program, uniform.name);
        }
    }
}
