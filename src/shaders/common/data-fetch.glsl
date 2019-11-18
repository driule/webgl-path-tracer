
vec4 getValueFromTexture(sampler2D texture, float index, float size) {
	ivec2 uv = ivec2(
        mod(index, size),
        floor(index / size)
    );
	
	return texelFetch(texture, uv, 0).rgba;
}

Triangle fetchTriangle(int id) {
    vec3 coordA = getValueFromTexture(triangleDataTexture, float(id * 7 + 0), triangleDataTextureSize).rgb;
    vec3 coordB = getValueFromTexture(triangleDataTexture, float(id * 7 + 1), triangleDataTextureSize).rgb;
    vec3 coordC = getValueFromTexture(triangleDataTexture, float(id * 7 + 2), triangleDataTextureSize).rgb;
    
    vec3 uv1 = getValueFromTexture(triangleDataTexture, float(id * 7 + 3), triangleDataTextureSize).rgb;
    vec3 uv2 = getValueFromTexture(triangleDataTexture, float(id * 7 + 4), triangleDataTextureSize).rgb;

    vec3 material = getValueFromTexture(triangleDataTexture, float(id * 7 + 5), triangleDataTextureSize).rgb;
    vec3 normal = getValueFromTexture(triangleDataTexture, float(id * 7 + 6), triangleDataTextureSize).rgb;
    
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
    vec3 triangleIndex = getValueFromTexture(triangleDataTexture, float(id * 7 + 5), triangleDataTextureSize).rgb;

    return int(triangleIndex[1]);
}

Light fetchLight(int id) {
    vec3 position = getValueFromTexture(lightDataTexture, float(id * 2), lightDataTextureSize).rgb;
    vec3 featureVector = getValueFromTexture(lightDataTexture, float(id * 2 + 1), lightDataTextureSize).rgb;

    float radius = featureVector[0];
    float intensity = featureVector[1];
    
    return Light(id, position, radius, intensity);
}

BoundingBox fetchBoundingBox(int id) {
    vec3 min = getValueFromTexture(bvhDataTexture, float(id * 4 + 0), bvhDataTextureSize).rgb;
    vec3 max = getValueFromTexture(bvhDataTexture, float(id * 4 + 1), bvhDataTextureSize).rgb;
    vec3 data = getValueFromTexture(bvhDataTexture, float(id * 4 + 2), bvhDataTextureSize).rgb;
    vec3 children = getValueFromTexture(bvhDataTexture, float(id * 4 + 3), bvhDataTextureSize).rgb;

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
    vec3 color = getValueFromTexture(materialsTexture, float(id * 3 + 0), materialsTextureSize).rgb;
    vec3 data = getValueFromTexture(materialsTexture, float(id * 3 + 1), materialsTextureSize).rgb;
    vec3 albedoTextureSize = getValueFromTexture(materialsTexture, float(id * 3 + 2), materialsTextureSize).rgb;

    Material material;
    material.baseColor = color;
    material.hasAlbedoTexture = bool(data[0]);
    material.albedoTextureId = int(data[1]);
    material.albedoPixelOffset = data[2];

    material.albedoTextureWidth = albedoTextureSize[0];
    material.albedoTextureHeight = albedoTextureSize[1];
    material.hasAlpha = bool(albedoTextureSize[2]);

    return material;
}
