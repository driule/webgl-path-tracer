struct Material
{
    vec3 baseColor;

    // albedo
    int albedoTextureId;
    
    bool hasAlbedoTexture;
    bool hasAlpha;

    float albedoPixelOffset;
    float albedoTextureWidth;
    float albedoTextureHeight;
};