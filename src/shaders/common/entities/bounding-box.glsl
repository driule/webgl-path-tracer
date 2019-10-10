struct BoundingBox
{
    vec3 min, max;
    
    bool isLeaf;
    int first, count;
    int left, right, id;
};