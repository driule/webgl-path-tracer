struct Material
{
    // base color
    vec3 color;

    // albedo
    bool isAlbedoTextureDefined;
    int albedoTextureId;
    int albedoDataOffset;
    int albedoTextureWidth;
    int albedoTextureHeight;
};