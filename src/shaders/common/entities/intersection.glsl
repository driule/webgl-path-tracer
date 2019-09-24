struct Intersection
{
    // shading data
    Triangle triangle;
    Material material;
    vec3 color;
    
    // intersection params
    float t;
    vec3 hit;
};
