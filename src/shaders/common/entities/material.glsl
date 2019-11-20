struct Material
{
    vec3 baseColor;

    // albedo
    int albedoTextureId;
    
    bool hasAlbedoTexture;
    bool hasAlpha;

    int albedoPixelOffset;
    
    float albedoTextureWidth;
    float albedoTextureHeight;
};