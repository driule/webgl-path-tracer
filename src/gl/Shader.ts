import { gl } from "./GLUtilities";
import { Material } from "../geometry/Material";
import { Triangle } from "../geometry/Triangle";
import { Light } from "../geometry/Light";
import { BoundingBox } from "../geometry/BoundingBox";

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

    // ToDo: generalize way of sending data to the shader
    public setUniforms(uniforms: any): void {
        for (let name in uniforms) {

            if (name.toString() === "triangles") {
                let triangleList = new Float32Array(uniforms.triangleDataTextureSize * uniforms.triangleDataTextureSize * 3);
                for (let i = 0; i < uniforms.totalTriangles; i++) {
                    let triangle: Triangle = uniforms.triangles[i];

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
                    triangleList[i * 3 * 6 + 16] = 1.0;
                    triangleList[i * 3 * 6 + 17] = 1.0;
                }

                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, uniforms.triangleDataTextureSize, uniforms.triangleDataTextureSize, 0, gl.RGB, gl.FLOAT, triangleList);
                
                let triangleDataLocation = gl.getUniformLocation(this.program, "triangleDataTexture");
                gl.uniform1i(triangleDataLocation, 1);

                continue;
            }

            if (name.toString() === "lights") {
                let lightList = new Float32Array(uniforms.lightDataTextureSize * uniforms.lightDataTextureSize * 3);
                for (let i = 0; i < uniforms.totalLights; i++) {
                    let light: Light = uniforms.lights[i];

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

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, uniforms.lightDataTextureSize, uniforms.lightDataTextureSize, 0, gl.RGB, gl.FLOAT, lightList);
                
                let lightDataLocation = gl.getUniformLocation(this.program, "lightDataTexture");
                gl.uniform1i(lightDataLocation, 2);

                continue;
            }

            if (name.toString() == "bvhNodeList") {
                let bvhNodeDataList = new Float32Array(uniforms.bvhDataTextureSize * uniforms.bvhDataTextureSize * 3);
                for (let i = 0; i < uniforms.totalBvhNodes; i++) {
                    let bvhNode: BoundingBox = uniforms.bvhNodeList[i];

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

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, uniforms.bvhDataTextureSize, uniforms.bvhDataTextureSize, 0, gl.RGB, gl.FLOAT, bvhNodeDataList);
                
                let bvhDataLocation = gl.getUniformLocation(this.program, "bvhDataTexture");
                gl.uniform1i(bvhDataLocation, 3);

                continue;
            }

            if (name.toString() == "triangleIndices") {
                let triangleIndices = new Float32Array(uniforms.triangleIndicesDataTextureSize * uniforms.triangleIndicesDataTextureSize * 3);
                for (let i = 0; i < uniforms.triangleIndices.length; i++) {
                    triangleIndices[i * 3 + 0] = uniforms.triangleIndices[i];
                    triangleIndices[i * 3 + 1] = uniforms.triangleIndices[i];
                    triangleIndices[i * 3 + 2] = uniforms.triangleIndices[i];
                }

                gl.activeTexture(gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, uniforms.triangleIndicesDataTextureSize, uniforms.triangleIndicesDataTextureSize, 0, gl.RGB, gl.FLOAT, triangleIndices);
                
                let triangleIndicesDataLocation = gl.getUniformLocation(this.program, "triangleIndicesDataTexture");
                gl.uniform1i(triangleIndicesDataLocation, 4);

                continue;
            }

            if (name.toString() === "materials") {
                let texturePointer = 0;
                let materialList = new Float32Array(uniforms.materialsTextureSize * uniforms.materialsTextureSize * 3);
                for (let i = 0; i < uniforms.materials.length; i++) {
                    let material: Material = uniforms.materials[i];

                    materialList[i * 3 * 2 + 0] = material.getColor()[0];
                    materialList[i * 3 * 2 + 1] = material.getColor()[1];
                    materialList[i * 3 * 2 + 2] = material.getColor()[2];

                    if (material.getAlbedoTexture() != undefined) {
                        materialList[i * 3 * 2 + 3] = 1.0;
                        materialList[i * 3 * 2 + 4] = texturePointer;
                        materialList[i * 3 * 2 + 5] = texturePointer;
                        this.setMaterialTexture(texturePointer, material);
                        texturePointer++;
                    } else {
                        materialList[i * 3 * 2 + 3] = 0.0;
                        materialList[i * 3 * 2 + 4] = 0.0;
                        materialList[i * 3 * 2 + 5] = 0.0;
                    }
                }

                gl.activeTexture(gl.TEXTURE5);
                gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, uniforms.materialsTextureSize, uniforms.materialsTextureSize, 0, gl.RGB, gl.FLOAT, materialList);

                let materialsTextureLocation = gl.getUniformLocation(this.program, "materialsTexture");
                gl.uniform1i(materialsTextureLocation, 5);

                continue;
            }

            if (name.toString() === "skydome") {
                let rgbList = new Float32Array(uniforms.skydomeTextureSize * uniforms.skydomeTextureSize * 3);
                for (let i = 0; i < uniforms.skydomeWidth * uniforms.skydomeHeight; i++) {
                    rgbList[i * 3 + 0] = uniforms.skydome.data[i * 4 + 0];
                    rgbList[i * 3 + 1] = uniforms.skydome.data[i * 4 + 1];
                    rgbList[i * 3 + 2] = uniforms.skydome.data[i * 4 + 2];
                }

                gl.activeTexture(gl.TEXTURE6);
                gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, uniforms.skydomeTextureSize, uniforms.skydomeTextureSize, 0, gl.RGB, gl.FLOAT, rgbList);

                let skydomeTextureLocation = gl.getUniformLocation(this.program, "skydomeTexture");
                gl.uniform1i(skydomeTextureLocation, 6);

                continue;
            }

            let location = gl.getUniformLocation(this.program, name);
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
            var intUniforms = [
                "totalTriangles",
                "totalBvhNodes",
                "totalLights",
                "isSkydomeLoaded",
                "skydomeWidth",
                "skydomeHeight",
            ];
            var floatUniforms = [
                "timeSinceStart",
                "textureWeight",
                "triangleDataTextureSize",
                "bvhDataTextureSize",
                "triangleIndicesDataTextureSize",
                "lightDataTextureSize",
                "skydomeTextureSize",
                "materialsTextureSize"
            ];
    
            let value = uniforms[name];
            if (vector2Uniforms.indexOf(name) > -1) {
                gl.uniform2fv(location, new Float32Array([value[0], value[1]]));
            } else if (vector3Uniforms.indexOf(name) > -1) {
                gl.uniform3fv(location, new Float32Array([value[0], value[1], value[2]]));
            } else if (intUniforms.indexOf(name) > -1) {
                gl.uniform1i(location, value);
            } else if (floatUniforms.indexOf(name) > -1) {
                gl.uniform1f(location, value);
            }
        }
    }

    private setMaterialTexture(id: number, material: Material): void {
        // console.log('setting texture for [material, id]: ', material.getAlbedoTexture().src, id, "textureImage" + (id + 1));
        gl.activeTexture(gl.TEXTURE7 + id);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

        let image: HTMLImageElement = material.getAlbedoTexture();
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // ToDo: remove old settings
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        // ToDo: read settings from gltf
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        let textureImageLocation = gl.getUniformLocation(this.program, "textureImage" + (id + 1));
        gl.uniform1i(textureImageLocation, 7 + id);
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
