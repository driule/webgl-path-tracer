struct Material
{
    // base color
    vec3 color;

    // albedo
    bool isAlbedoTextureDefined;
    int albedoTextureId;
    float albedoPixelOffset;
    float albedoTextureWidth;
    float albedoTextureHeight;
};