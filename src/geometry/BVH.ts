import { Triangle } from "./Triangle";
import { BoundingBox } from "./BoundingBox";

import { vec3 } from "gl-matrix";

export class BVH {

    private _root: BoundingBox;

    private _triangles: Triangle[];
    private _triangleIndices: number[];

    private _nodeStack: BoundingBox[];

    public get root(): BoundingBox {
        return this._root;
    }

    public get triangleIndices(): number[] {
        return this._triangleIndices;
    }

    public get nodeStack(): BoundingBox[] {
        return this._nodeStack;
    }

    public constructor(triangles: Triangle[]) {
        this._nodeStack = [];
        this._triangles = triangles;

        this._triangleIndices = new Array(this._triangles.length);
        for (let i = 0; i < this._triangles.length; i++) {
            this._triangleIndices[i] = i;
        }
    
        this._root = new BoundingBox(0);
        this._root.first = 0;
        this._root.count = this._triangles.length;
        this._nodeStack.push(this._root);
    
        this.calculateBounds(this.root);
        this.subdivide(this.root, 0);
    }

    private calculateBounds(node: BoundingBox): void {
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
    
        for (let i = node.first; i < node.first + node.count; i++) {
            let index = this._triangleIndices[i];
            minX = Math.min(this._triangles[index].boundingBox.min[0], minX);
            minY = Math.min(this._triangles[index].boundingBox.min[1], minY);
            minZ = Math.min(this._triangles[index].boundingBox.min[2], minZ);
    
            maxX = Math.max(this._triangles[index].boundingBox.max[0], maxX);
            maxY = Math.max(this._triangles[index].boundingBox.max[1], maxY);
            maxZ = Math.max(this._triangles[index].boundingBox.max[2], maxZ);
        }
    
        node.min = vec3.fromValues(minX, minY, minZ);
        node.max = vec3.fromValues(maxX, maxY, maxZ);
        node.calculateCenter();
    }

    private subdivide(node: BoundingBox, depth: number): void {
        if (node.count <= 3 || depth >= 15) {
            node.isLeaf = true;
            return;
        } else {
            node.isLeaf = false;
        }

        node.left = new BoundingBox(this._nodeStack.length);
        this._nodeStack.push(node.left);
    
        node.right = new BoundingBox(this._nodeStack.length);
        this._nodeStack.push(node.right);
    
        this.partition(node);
    
        depth++;
        this.subdivide(node.left, depth);
        this.subdivide(node.right, depth);
    }

    // determine left and right node primitives
    private partition(node: BoundingBox): void {
        let optimalSAH = Infinity;
        let optimalLeftCount = 1;
        let optimalRightCount = node.count - optimalLeftCount;
    
        let optimalObjectIndices: number[] = new Array(node.count);
        for (let i = 0; i < node.count; i++) {
            optimalObjectIndices[i] = this._triangleIndices[node.first + i];
        }
    
        let binCount = 10;
        let bins: number[][] = [];

        let binWidth: vec3 = vec3.subtract(vec3.create(), node.max, node.min);
        binWidth[0] = binWidth[0] / binCount;
        binWidth[1] = binWidth[1] / binCount;
        binWidth[2] = binWidth[2] / binCount;

        if (binWidth[0] == 0) binWidth[0] = 1;
        if (binWidth[1] == 0) binWidth[1] = 1;
        if (binWidth[2] == 0) binWidth[2] = 1;
    
        for (let axis = 0; axis < 3; axis++) {
            for (let i = 0; i < binCount; i++) bins[i] = [];
    
            // divide objects to bins
            for (let i = node.first; i < node.first + node.count; i++) {
                let index = this._triangleIndices[i], binIndex: number;
    
                if (axis == 0)		binIndex = Math.floor((this._triangles[index].boundingBox.center[0] - node.min[0]) / binWidth[0]);
                else if (axis == 1)	binIndex = Math.floor((this._triangles[index].boundingBox.center[1] - node.min[1]) / binWidth[1]);
                else if (axis == 2)	binIndex = Math.floor((this._triangles[index].boundingBox.center[2] - node.min[2]) / binWidth[2]);
    
                binIndex = Math.min(binCount - 1, binIndex);
                bins[binIndex].push(index);
            }
    
            // sort objects
            let count = 0;
            for (let i = 0; i < binCount; i++) {
                for (let j = 0; j < bins[i].length; j++) {
                    this._triangleIndices[node.first + count] = bins[i][j];
                    count++;
                }
            }
    
            // evaluate bin combinations
            for (let i = 0; i < binCount - 1; i++) {
                let leftCount = 0, rightCount = 0;
                for (let j = 0; j <= i; j++) {
                    leftCount += bins[j].length;
                }
                rightCount = node.count - leftCount;
    
                if (leftCount == 0 || rightCount == 0) continue;
    
                node.left.first = node.first;
                node.left.count = leftCount;
                this.calculateBounds(node.left);
    
                node.right.first = node.first + leftCount;
                node.right.count = rightCount;
                this.calculateBounds(node.right);
    
                // calculate surface area
                let surfaceAreaLeft = node.left.calculateSurfaceArea();
                let surfaceAreaRight = node.right.calculateSurfaceArea();
                let SAH = surfaceAreaLeft * node.left.count + surfaceAreaRight * node.right.count;
    
                // save the optimal split according Surface Area Heuristic
                if (SAH < optimalSAH && SAH < (surfaceAreaLeft + surfaceAreaRight) * node.count) {
                    optimalSAH = SAH;
                    optimalLeftCount = leftCount;
                    optimalRightCount = rightCount;
    
                    for (let j = 0; j < node.count; j++) {
                        optimalObjectIndices[j] = this._triangleIndices[node.first + j];
                    }
                }
            }
        }
    
        // set optimal split values
        for (let i = 0; i < node.count; i++) {
            this._triangleIndices[node.first + i] = optimalObjectIndices[i];
        }
    
        node.left.first = node.first;
        node.left.count = optimalLeftCount;
        this.calculateBounds(node.left);
    
        node.right.first = node.first + optimalLeftCount;
        node.right.count = optimalRightCount;
        this.calculateBounds(node.right);
    }
}
