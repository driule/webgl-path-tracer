
vec4 getValueFromTexture(sampler2D texture, int index, int size, int sizePower) {
    ivec2 uv = ivec2(
        index & size - 1,
        index >> sizePower
    );
	
	return texelFetch(texture, uv, 0).rgba;
}

Triangle fetchTriangle(int id) {
    vec3 coordA = getValueFromTexture(triangleDataTexture, id * 7, triangleDataTextureSize, triangleDataTextureSizePower).rgb;
    vec3 coordB = getValueFromTexture(triangleDataTexture, id * 7 + 1, triangleDataTextureSize, triangleDataTextureSizePower).rgb;
    vec3 coordC = getValueFromTexture(triangleDataTexture, id * 7 + 2, triangleDataTextureSize, triangleDataTextureSizePower).rgb;
    
    vec3 uv1 = getValueFromTexture(triangleDataTexture, id * 7 + 3, triangleDataTextureSize, triangleDataTextureSizePower).rgb;
    vec3 uv2 = getValueFromTexture(triangleDataTexture, id * 7 + 4, triangleDataTextureSize, triangleDataTextureSizePower).rgb;

    vec3 material = getValueFromTexture(triangleDataTexture, id * 7 + 5, triangleDataTextureSize, triangleDataTextureSizePower).rgb;
    vec3 normal = getValueFromTexture(triangleDataTexture, id * 7 + 6, triangleDataTextureSize, triangleDataTextureSizePower).rgb;
    
    Triangle triangle;
    triangle.a = coordA;
    triangle.b = coordB;
    triangle.c = coordC;
    triangle.uvA = vec2(uv1[0], uv1[1]);
    triangle.uvB = vec2(uv1[2], uv2[0]);
    triangle.uvC = vec2(uv2[1], uv2[2]);
    triangle.materialID = int(material[0]);
    triangle.normal = normal;

    return triangle;
}

int fetchTriangleIndex(int id) {
    vec3 triangleIndex = getValueFromTexture(triangleDataTexture, id * 7 + 5, triangleDataTextureSize, triangleDataTextureSizePower).rgb;

    return int(triangleIndex[1]);
}

Light fetchLight(int id) {
    vec3 position = getValueFromTexture(lightDataTexture, id * 2, lightDataTextureSize, lightDataTextureSizePower).rgb;
    vec3 featureVector = getValueFromTexture(lightDataTexture, id * 2 + 1, lightDataTextureSize, lightDataTextureSizePower).rgb;

    float radius = featureVector[0];
    float intensity = featureVector[1];
    
    return Light(id, position, radius, intensity);
}

BoundingBox fetchBoundingBox(int id) {
    vec3 min = getValueFromTexture(bvhDataTexture, id * 4 + 0, bvhDataTextureSize, bvhDataTextureSizePower).rgb;
    vec3 max = getValueFromTexture(bvhDataTexture, id * 4 + 1, bvhDataTextureSize, bvhDataTextureSizePower).rgb;
    vec3 data = getValueFromTexture(bvhDataTexture, id * 4 + 2, bvhDataTextureSize, bvhDataTextureSizePower).rgb;
    vec3 children = getValueFromTexture(bvhDataTexture, id * 4 + 3, bvhDataTextureSize, bvhDataTextureSizePower).rgb;

    BoundingBox boundingBox;
    boundingBox.min = min;
    boundingBox.max = max;
    boundingBox.isLeaf = bool(data[0]);
    boundingBox.first = int(data[1]);
    boundingBox.count = int(data[2]);
    boundingBox.left = int(children[0]);
    boundingBox.right = int(children[1]);
    boundingBox.id = int(children[2]);

    return boundingBox;
}

Material fetchMaterial(int id) {
    vec3 color = getValueFromTexture(materialsTexture, id * 3 + 0, materialsTextureSize, materialsTextureSizePower).rgb;
    vec3 data = getValueFromTexture(materialsTexture, id * 3 + 1, materialsTextureSize, materialsTextureSizePower).rgb;
    vec3 albedoTextureSize = getValueFromTexture(materialsTexture, id * 3 + 2, materialsTextureSize, materialsTextureSizePower).rgb;

    Material material;
    material.baseColor = color;
    material.hasAlbedoTexture = bool(data[0]);
    material.albedoTextureId = int(data[1]);
    material.albedoPixelOffset = int(data[2]);

    material.albedoTextureWidth = albedoTextureSize[0];
    material.albedoTextureHeight = albedoTextureSize[1];
    material.hasAlpha = bool(albedoTextureSize[2]);

    return material;
}
