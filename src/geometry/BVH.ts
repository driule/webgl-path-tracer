import { Triangle } from "./Triangle";
import { BoundingBox } from "./BoundingBox";

import { vec3 } from "gl-matrix";

export class BVH {

    private root: BoundingBox;

    private triangles: Triangle[];
    private triangleIndices: number[];

    private nodeList: BoundingBox[];

    private buildTime: number;

    public getRoot(): BoundingBox {
        return this.root;
    }

    public getTriangleIndices(): number[] {
        return this.triangleIndices;
    }

    public getNodeList(): BoundingBox[] {
        return this.nodeList;
    }

    public constructor(triangles: Triangle[]) {
        let buildingStartTime = performance.now();

        this.nodeList = [];
        this.triangles = triangles;

        this.triangleIndices = new Array(this.triangles.length);
        for (let i = 0; i < this.triangles.length; i++) {
            this.triangleIndices[i] = i;
        }
    
        this.root = new BoundingBox(0);
        this.root.first = 0;
        this.root.count = this.triangles.length;
        this.nodeList.push(this.root);
    
        this.calculateBounds(this.root);
        this.subdivide(this.root, 0);

        this.buildTime = performance.now() - buildingStartTime;
        console.log("BVH build time", this.buildTime);
    }

    private calculateBounds(node: BoundingBox): void {
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let minX = Infinity, minY = Infinity, minZ = Infinity;
    
        for (let i = node.first; i < node.first + node.count; i++) {
            let index = this.triangleIndices[i];
            minX = Math.min(this.triangles[index].getBoundingBox().min[0], minX);
            minY = Math.min(this.triangles[index].getBoundingBox().min[1], minY);
            minZ = Math.min(this.triangles[index].getBoundingBox().min[2], minZ);
    
            maxX = Math.max(this.triangles[index].getBoundingBox().max[0], maxX);
            maxY = Math.max(this.triangles[index].getBoundingBox().max[1], maxY);
            maxZ = Math.max(this.triangles[index].getBoundingBox().max[2], maxZ);
        }
    
        node.min = vec3.fromValues(minX, minY, minZ);
        node.max = vec3.fromValues(maxX, maxY, maxZ);
        node.calculateCenter();
    }

    private subdivide(node: BoundingBox, depth: number): void {
        if (node.count <= 3 || depth >= 25) {
            node.isLeaf = true;

            if (node.count > 15) {
                console.log("node; depth:", node, depth);
            }

            return;
        }
        
        node.isLeaf = false;

        node.left = new BoundingBox(this.nodeList.length);
        this.nodeList.push(node.left);
    
        node.right = new BoundingBox(this.nodeList.length);
        this.nodeList.push(node.right);
    
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
            optimalObjectIndices[i] = this.triangleIndices[node.first + i];
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
                let index = this.triangleIndices[i], binIndex: number;
    
                if (axis == 0)		binIndex = Math.floor((this.triangles[index].getBoundingBox().getCenter()[0] - node.min[0]) / binWidth[0]);
                else if (axis == 1)	binIndex = Math.floor((this.triangles[index].getBoundingBox().getCenter()[1] - node.min[1]) / binWidth[1]);
                else if (axis == 2)	binIndex = Math.floor((this.triangles[index].getBoundingBox().getCenter()[2] - node.min[2]) / binWidth[2]);
    
                binIndex = Math.min(binCount - 1, binIndex);
                bins[binIndex].push(index);
            }
    
            // sort objects
            let count = 0;
            for (let i = 0; i < binCount; i++) {
                for (let j = 0; j < bins[i].length; j++) {
                    this.triangleIndices[node.first + count] = bins[i][j];
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
                        optimalObjectIndices[j] = this.triangleIndices[node.first + j];
                    }
                }
            }
        }
    
        // set optimal split values
        for (let i = 0; i < node.count; i++) {
            this.triangleIndices[node.first + i] = optimalObjectIndices[i];
        }
    
        node.left.first = node.first;
        node.left.count = optimalLeftCount;
        this.calculateBounds(node.left);
    
        node.right.first = node.first + optimalLeftCount;
        node.right.count = optimalRightCount;
        this.calculateBounds(node.right);
    }

    public getBuildingTime(): number {
        return this.buildTime;
    }
}
