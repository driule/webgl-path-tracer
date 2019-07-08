import { GltfLoader, GltfAsset } from "gltf-loader-ts";
import { vec3, vec2 } from "gl-matrix";
import { Triangle } from "../geometry/Triangle";
import { Accessor, BufferView } from "gltf-loader-ts/lib/gltf";
import { Material } from "../geometry/Material";
import { Skydome } from "../geometry/Skydome";

const parseHDR = require('parse-hdr');
    
const accessorTypeToNumComponentsMap: any = {
    "SCALAR": 1,
    "VEC2": 2,
    "VEC3": 3,
    "VEC4": 4,
    "MAT2": 4,
    "MAT3": 9,
    "MAT4": 16
};

export class GeometryLoader  {

    public static async loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            let image: HTMLImageElement = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    public static async parseHDR(src: string): Promise<Skydome> {
        let hdr = parseHDR(await this.loadSkydome(src));

        return new Skydome(
            hdr.data,
            hdr.shape[0],
            hdr.shape[1],
        );
    }

    public static async loadSkydome(src: string): Promise<ArrayBuffer> {
        return new Promise((resolve) => {
            let request = new XMLHttpRequest();
            request.open("GET", src, true);
            request.responseType = "arraybuffer";
            request.onload = () => resolve(request.response);
            request.send(null);
        });
    }

    public static async loadImageData(image: HTMLImageElement): Promise<Float32Array> {
        let rgbList = new Float32Array(image.width * image.height * 3);

        let albedoTextureCanvas = document.createElement('canvas') as HTMLCanvasElement;
        albedoTextureCanvas.width = image.width;
        albedoTextureCanvas.height = image.height;
        
        let canvasContext2D = albedoTextureCanvas.getContext('2d');
        await canvasContext2D.drawImage(image, 0, 0);
        let imageData = canvasContext2D.getImageData(0, 0, albedoTextureCanvas.width, albedoTextureCanvas.height).data;

        for (let i = 0; i < rgbList.length / 3; i++) {
            rgbList[i * 3 + 0] = imageData[i * 4 + 0] / 255.0;
            rgbList[i * 3 + 1] = imageData[i * 4 + 1] / 255.0;
            rgbList[i * 3 + 2] = imageData[i * 4 + 2] / 255.0;
        }

        return rgbList;
    }

    // include GLTF file example:
    // const duckModel = require("./assets/models/duck/Duck.gltf");

    // note:
    // mesh contains primitives which attribute POSITION refers to the accessor which describes how to use bufferView (slice of the whole buffer).

    public static async loadGltf(
        path: string,
        fileName: string,
        materialOffset: number,
        scale: number = 1.0,
        translation: vec3 = vec3.fromValues(0, 0, 0)
    ): Promise<[Triangle[], Material[]]> {
        let loader = new GltfLoader();
        let asset: GltfAsset = await loader.load(path + fileName);

        let triangles: Triangle[] = [];
        let materials: Material[] = [];

        // blank material for testing
        // let material = new Material(0);

        // load all available materials
        for (let i = 0; i < asset.gltf.materials.length; i++) {
            let material = new Material(materialOffset + i); // ToDo: set globaly unique ID

            let baseColorTexture = asset.gltf.materials[i].pbrMetallicRoughness.baseColorTexture;
            if (baseColorTexture != undefined) {
                let texture = asset.gltf.textures[baseColorTexture.index];
                let imageUri = path + asset.gltf.images[texture.source].uri;

                let albedoTextureImage = await this.loadImage(imageUri);

                material.setAlbedoImageElement(albedoTextureImage);
                material.setAlbedoImageData(await this.loadImageData(albedoTextureImage));
            }

            let baseColor = asset.gltf.materials[i].pbrMetallicRoughness.baseColorFactor;
            if (baseColor != undefined) {
                material.setColor(vec3.fromValues(baseColor[0], baseColor[1], baseColor[2]));
            }

            materials.push(material);
        }
        //

        // for each primitive of each mesh compose geometry data
        for (let m = 0; m < asset.gltf.meshes.length; m++) {
            for (let p = 0; p < asset.gltf.meshes[m].primitives.length; p++) {

                // "4" or "undefined" defines triangular mode
                let renderingMode = asset.gltf.meshes[m].primitives[p].mode;
                if (renderingMode != 4 && renderingMode != undefined) {
                    console.log("Geometry rendering mode is not triangular! Cannot read GLTF file with mode: ", renderingMode);
                    return [[], []];
                }
                //

                // load vertex data
                let vertexAccesorId = asset.gltf.meshes[m].primitives[p].attributes.POSITION;
                let vertexAccesor = asset.gltf.accessors[vertexAccesorId];
                let vertexData = await asset.accessorData(vertexAccesorId);

                let vertexArray = this.loadTypedArray(
                    vertexData.buffer,
                    asset.gltf.accessors[vertexAccesorId],
                    asset.gltf.bufferViews[vertexAccesor.bufferView]
                );
                
                let meshVertices: vec3[] = [];
                for (let i = 0; i < vertexAccesor.count; i++) {
                    let vertex: vec3 = vec3.fromValues(vertexArray[i * 3 + 0] * scale + translation[0], vertexArray[i * 3 + 1] * scale + translation[1], vertexArray[i * 3 + 2] * scale + translation[2]);
                    meshVertices.push(vertex);
                }
                //

                // load texture coordinates
                let textureCoordinates: vec2[] = [];
                let texCoordAccesorId = asset.gltf.meshes[m].primitives[p].attributes.TEXCOORD_0;
                if (texCoordAccesorId != undefined) {
                    let texCoordAccesor = asset.gltf.accessors[texCoordAccesorId];
                    let texCoordData = await asset.accessorData(texCoordAccesorId);
                    
                    let texCoordArray = this.loadTypedArray(
                        texCoordData.buffer,
                        asset.gltf.accessors[texCoordAccesorId],
                        asset.gltf.bufferViews[texCoordAccesor.bufferView]
                    );
                    
                    for (let i = 0; i < texCoordAccesor.count; i++) {
                        let texCoord: vec2 = vec2.fromValues(texCoordArray[i * 2 + 0], texCoordArray[i * 2 + 1]);
                        textureCoordinates.push(texCoord);
                    }
                }
                //
                
                let materialId = asset.gltf.meshes[m].primitives[p].material;
                let material = materials[materialId];
            
                // load vertex indices data
                let indicesAccesorId = asset.gltf.meshes[m].primitives[p].indices;
                if (indicesAccesorId != undefined) {
                    let indicesData = await asset.accessorData(indicesAccesorId);
                    let indicesAccesor = asset.gltf.accessors[indicesAccesorId];

                    let meshIndices = this.loadTypedArray(
                        indicesData.buffer,
                        asset.gltf.accessors[indicesAccesorId],
                        asset.gltf.bufferViews[indicesAccesor.bufferView]
                    );

                    // compose indexed triangles
                    for (let i = 0; i < meshIndices.length / 3; i++) {
                        let a: vec3 = meshVertices[meshIndices[i * 3 + 0]];
                        let b: vec3 = meshVertices[meshIndices[i * 3 + 1]];
                        let c: vec3 = meshVertices[meshIndices[i * 3 + 2]];
                        let triangle: Triangle = new Triangle(a, b, c, material);

                        if (texCoordAccesorId != undefined) {
                            triangle.setUvA(textureCoordinates[meshIndices[i * 3 + 0]]);
                            triangle.setUvB(textureCoordinates[meshIndices[i * 3 + 1]]);
                            triangle.setUvC(textureCoordinates[meshIndices[i * 3 + 2]]);
                        }

                        triangles.push(triangle);
                    }
                } else {
                    // ToDo: implement non-indexed triangles (3 vertexes in a row form a triangle)
                    console.log("Cannot read non-indexed geometry!");
                    return [[], []];
                }
            }
        }
    
        return [triangles, materials];
    }

    private static loadTypedArray(buffer: ArrayBuffer, accessor: Accessor, bufferView: BufferView): [] {
        let typedArray: any = [];

        let accessorOffset = 0, bufferViewOffset = 0;
        accessor.byteOffset != undefined ? accessorOffset = accessor.byteOffset : accessorOffset = 0;
        bufferView.byteOffset != undefined ? bufferViewOffset = bufferView.byteOffset : accessorOffset = 0;
        
        if (accessor.componentType == 5126) {
            // FLOAT (4 bytes)
            typedArray = new Float32Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        } else if (accessor.componentType == 5125) {
            // UNSIGNED_INT (4 bytes)
            typedArray = new Uint32Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        } else if (accessor.componentType == 5123) {
            // UNSIGNED_SHORT (2 bytes)
            typedArray = new Uint16Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        } else if (accessor.componentType == 5122) {
            // SHORT (2 bytes)
            typedArray = new Int16Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        } else if (accessor.componentType == 5121) {
            // UNSIGNED_BYTE (1 byte)
            typedArray = new Uint8Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        } else if (accessor.componentType == 5120) {
            // BYTE (1 byte)
            typedArray = new Int8Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        } else {
            console.log("GLTF accessor component type cannot be read: " + accessor.componentType);
        }

        return typedArray;
    }
}