struct BoundingBox
{
    vec3 min, max;
    // vec3 leftMin, leftMax, rightMin, rightMax;
    bool isLeaf;
    int first, count;
    int left, right, id;
    bool isProcessed;
};