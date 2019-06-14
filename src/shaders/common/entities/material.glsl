struct Material
{
    // base color
    vec3 color;

    // albedo
    bool isAlbedoTextureDefined;
    int albedoTextureId;
    int albedoPixelOffset;
    int albedoTextureWidth;
    int albedoTextureHeight;
};