import { GltfLoader, GltfAsset } from "gltf-loader-ts";
import { vec3 } from "gl-matrix";
import { Triangle } from "../geometry/Triangle";
import { Accessor, BufferView } from "gltf-loader-ts/lib/gltf";
    
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

    // include GLTF file example:
    // const duckModel = require("./assets/models/duck/Duck.gltf");

    // note:
    // mesh contains primitives which attribute POSITION refers to the accessor which describes how to use bufferView (slice of the whole buffer).

    public static async loadGltf(
        uri: string = "assets/models/duck/Duck.gltf",
        scale: number = 1.0,
        translation: vec3 = vec3.fromValues(0, 0, 0)
    ) {
        let loader = new GltfLoader();
        let asset: GltfAsset = await loader.load(uri);
        let triangles: Triangle[] = [];

        // for each primitive of each mesh compose geometry data
        for (let m = 0; m < asset.gltf.meshes.length; m++) {
            for (let p = 0; p < asset.gltf.meshes[m].primitives.length; p++) {

                // "4" or "undefined" defines triangular mode
                let renderingMode = asset.gltf.meshes[m].primitives[p].mode;
                if (renderingMode != 4 && renderingMode != undefined) {
                    console.log("Geometry rendering mode is not triangular! Cannot read GLTF file with mode: ", renderingMode);
                    return [];
                }

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
                
                        triangles.push(new Triangle(a, b, c));
                    }
                } else {
                    // ToDo: implement non-indexed triangles (3 vertexes in a row form a triangle)
                    console.log("Cannot read non-indexed geometry!");
                    return [];
                }
            }
        }
    
        return triangles;
    }

    private static loadTypedArray(buffer: ArrayBuffer, accessor: Accessor, bufferView: BufferView): any {
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