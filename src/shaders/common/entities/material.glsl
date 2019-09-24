struct Material
{
    // base color
    vec3 color;

    // albedo
    bool isAlbedoTextureDefined;
    bool hasAlpha;
    int albedoTextureId;
    float albedoPixelOffset;
    float albedoTextureWidth;
    float albedoTextureHeight;
};