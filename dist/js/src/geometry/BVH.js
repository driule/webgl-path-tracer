var LH;
(function (LH) {
    var BVH = /** @class */ (function () {
        function BVH() {
        }
        Object.defineProperty(BVH.prototype, "root", {
            get: function () {
                return this._root;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BVH.prototype, "triangleIndices", {
            get: function () {
                return this._triangleIndices;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BVH.prototype, "nodeStack", {
            get: function () {
                return this._nodeStack;
            },
            enumerable: true,
            configurable: true
        });
        BVH.prototype.build = function (triangles) {
            this._nodeStack = [];
            this._triangles = triangles;
            this._triangleIndices = new Array(this._triangles.length);
            for (var i = 0; i < this._triangles.length; i++) {
                this._triangleIndices[i] = i;
            }
            this._root = new LH.BoundingBox(0);
            this._root.first = 0;
            this._root.count = this._triangles.length;
            this._nodeStack.push(this._root);
            this.calculateBounds(this.root);
            this.subdivide(this.root, 0);
        };
        BVH.prototype.calculateBounds = function (node) {
            var maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            var minX = Infinity, minY = Infinity, minZ = Infinity;
            for (var i = node.first; i < node.first + node.count; i++) {
                var index = this._triangleIndices[i];
                // console.log(index);
                minX = Math.min(this._triangles[index].boundingBox.min[0], minX);
                minY = Math.min(this._triangles[index].boundingBox.min[1], minY);
                minZ = Math.min(this._triangles[index].boundingBox.min[2], minZ);
                maxX = Math.max(this._triangles[index].boundingBox.max[0], maxX);
                maxY = Math.max(this._triangles[index].boundingBox.max[1], maxY);
                maxZ = Math.max(this._triangles[index].boundingBox.max[2], maxZ);
            }
            node.min = [minX, minY, minZ];
            node.max = [maxX, maxY, maxZ];
            node.calculateCenter();
        };
        BVH.prototype.subdivide = function (node, depth) {
            if (node.count <= 3 || depth >= 10) {
                node.isLeaf = true;
                return;
            }
            else {
                node.isLeaf = false;
            }
            node.left = new LH.BoundingBox(this._nodeStack.length);
            this._nodeStack.push(node.left);
            node.right = new LH.BoundingBox(this._nodeStack.length);
            this._nodeStack.push(node.right);
            this.partition(node);
            depth++;
            this.subdivide(node.left, depth);
            this.subdivide(node.right, depth);
        };
        // determine left and right node primitives
        BVH.prototype.partition = function (node) {
            var optimalSAH = Infinity;
            var optimalLeftCount = 1;
            var optimalRightCount = node.count - optimalLeftCount;
            var optimalObjectIndices = new Array(node.count);
            for (var i = 0; i < node.count; i++) {
                optimalObjectIndices[i] = this._triangleIndices[node.first + i];
            }
            var binCount = 10;
            var bins = [];
            var binWidth = glMatrix.vec3.subtract([], node.max, node.min);
            binWidth[0] = Math.floor(binWidth[0] / binCount);
            binWidth[1] = Math.floor(binWidth[1] / binCount);
            binWidth[2] = Math.floor(binWidth[2] / binCount);
            if (binWidth[0] == 0)
                binWidth[0] = 1;
            if (binWidth[1] == 0)
                binWidth[1] = 1;
            if (binWidth[2] == 0)
                binWidth[2] = 1;
            for (var axis = 0; axis < 3; axis++) {
                for (var i = 0; i < binCount; i++)
                    bins[i] = [];
                // divide objects to bins
                for (var i = node.first; i < node.first + node.count; i++) {
                    var index = this._triangleIndices[i], binIndex = void 0;
                    if (axis == 0)
                        binIndex = Math.floor((this._triangles[index].boundingBox.center[0] - node.min[0]) / binWidth[0]);
                    else if (axis == 1)
                        binIndex = Math.floor((this._triangles[index].boundingBox.center[1] - node.min[1]) / binWidth[1]);
                    else if (axis == 2)
                        binIndex = Math.floor((this._triangles[index].boundingBox.center[2] - node.min[2]) / binWidth[2]);
                    binIndex = Math.min(binCount - 1, binIndex);
                    bins[binIndex].push(index);
                }
                // sort objects
                var count = 0;
                for (var i = 0; i < binCount; i++) {
                    for (var j = 0; j < bins[i].length; j++) {
                        this._triangleIndices[node.first + count] = bins[i][j];
                        count++;
                    }
                }
                // evaluate bin combinations
                for (var i = 0; i < binCount - 1; i++) {
                    var leftCount = 0, rightCount = 0;
                    for (var j = 0; j <= i; j++) {
                        leftCount += bins[j].length;
                    }
                    rightCount = node.count - leftCount;
                    if (leftCount == 0 || rightCount == 0)
                        continue;
                    node.left.first = node.first;
                    node.left.count = leftCount;
                    this.calculateBounds(node.left);
                    node.right.first = node.first + leftCount;
                    node.right.count = rightCount;
                    this.calculateBounds(node.right);
                    // calculate surface area
                    var surfaceAreaLeft = node.left.calculateSurfaceArea();
                    var surfaceAreaRight = node.right.calculateSurfaceArea();
                    var SAH = surfaceAreaLeft * node.left.count + surfaceAreaRight * node.right.count;
                    // save the optimal split according Surface Area Heuristic
                    if (SAH < optimalSAH && SAH < (surfaceAreaLeft + surfaceAreaRight) * node.count) {
                        optimalSAH = SAH;
                        optimalLeftCount = leftCount;
                        optimalRightCount = rightCount;
                        for (var j = 0; j < node.count; j++) {
                            optimalObjectIndices[j] = this._triangleIndices[node.first + j];
                        }
                    }
                }
            }
            // set optimal split values
            for (var i = 0; i < node.count; i++) {
                this._triangleIndices[node.first + i] = optimalObjectIndices[i];
            }
            node.left.first = node.first;
            node.left.count = optimalLeftCount;
            this.calculateBounds(node.left);
            node.right.first = node.first + optimalLeftCount;
            node.right.count = optimalRightCount;
            this.calculateBounds(node.right);
        };
        return BVH;
    }());
    LH.BVH = BVH;
})(LH || (LH = {}));
//# sourceMappingURL=BVH.js.map