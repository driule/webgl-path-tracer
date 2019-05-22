import { GltfLoader, GltfAsset } from 'gltf-loader-ts';
import { vec3 } from 'gl-matrix';
import { Triangle } from '../geometry/Triangle';
    
const accessorTypeToNumComponentsMap: any = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
    'VEC4': 4,
    'MAT2': 4,
    'MAT3': 9,
    'MAT4': 16
};

export class GeometryLoader  {

    // mesh contains primitives which attribute POSITION refers to the accessor which describes how to use bufferView (slice of the whole buffer).

    public static async loadGltf(uri: string = 'assets/models/duck/Duck.gltf') {
        let loader = new GltfLoader();
        let asset: GltfAsset = await loader.load(uri);
        let triangles: Triangle[] = [];

        // '4' or 'undefined' defines triangular mode
        let renderingMode = asset.gltf.meshes[0].primitives[0].mode;
        if (renderingMode != 4 && renderingMode != undefined) {
            console.log('Geometry rendering mode is not triangular! Cannot read GLTF file with mode: ', renderingMode);
            return [];
        }

        let vertexAccesorId = asset.gltf.meshes[0].primitives[0].attributes.POSITION;
        let vertexAccesor = asset.gltf.accessors[vertexAccesorId];
        let vertexBufferView = asset.gltf.bufferViews[vertexAccesor.bufferView];
        let vertexData = await asset.accessorData(vertexAccesorId);
        let vertexBuffer = vertexData.buffer;
        // console.log('vertexBuffer', vertexBuffer.slice(vertexBufferView.byteOffset, 1));

        // testing code
        let buffer = vertexData.buffer;
        let accessor = asset.gltf.accessors[vertexAccesorId];
        let bufferView = vertexBufferView;

        let accessorOffset = 0;
        let bufferViewOffset = 0;
        accessor.byteOffset != undefined ? accessorOffset = accessor.byteOffset : accessorOffset = 0;
        bufferView.byteOffset != undefined ? bufferViewOffset = vertexBufferView.byteOffset : accessorOffset = 0;
        var typedView = new Float32Array(buffer, accessorOffset + bufferViewOffset, accessor.count * accessorTypeToNumComponentsMap[accessor.type]);
        // console.log('buffer', buffer);
        // console.log('typedView', typedView);

        let meshVertices: vec3[] = [];
        for (let i = 0; i < accessor.count; i++) {
            let vertex: vec3 = vec3.fromValues(typedView[i * 3 + 0], typedView[i * 3 + 1], typedView[i * 3 + 2]);
            meshVertices.push(vertex);
        }
        //
    
        // create mesh vertices (parsing VEC3)
        // let meshVertices: vec3[] = [];
        // console.log(asset.gltf.accessors[vertexAccesorId].count);
        // for (let i = 0; i < asset.gltf.accessors[vertexAccesorId].count; i++) {
        //     let vertexValues = new Float32Array(vertexData.slice(i * 12, i * 12 + 12).buffer);
        //     let vertex: vec3 = vec3.fromValues(vertexValues[0], vertexValues[1], vertexValues[2]);
    
        //     meshVertices.push(vertex);
        // }
    
        let indicesAccesorId = await asset.gltf.meshes[0].primitives[0].indices;

        if (indicesAccesorId != undefined) {
            let indicesData = await asset.accessorData(indicesAccesorId);
            let meshIndices = new Uint16Array(indicesData.slice(0, indicesData.length).buffer);

            // compose indexed triangles
            for (let i = 0; i < meshIndices.length / 3; i++) {
                let a: vec3 = meshVertices[meshIndices[i * 3 + 0]];
                let b: vec3 = meshVertices[meshIndices[i * 3 + 1]];
                let c: vec3 = meshVertices[meshIndices[i * 3 + 2]];
        
                triangles.push(new Triangle(a, b, c));
            }
        } else {
            // ToDo: implement non-indexed triangles (3 vertexes in a row form a triangle)
            console.log('Cannot read non-indexed geometry!');
            return [];
        }
    
        return triangles;
    }
}