// namespace LH {

    import * as glMatrix from "gl-matrix";

    export class BoundingBox {

        public min: glMatrix.vec3; // vec3
        public max: glMatrix.vec3; // vec3

        public isLeaf: boolean;
        public left: BoundingBox;
        public right: BoundingBox;
        public first: number;
        public count: number;
        
        private _id: number;
        private _center: glMatrix.vec3; // vec3

        public constructor(id: number) {
            this._id = id;
        }

        public get id(): number {
            return this._id;
        }

        public get center(): any {
            return this._center;
        }

        public calculateSurfaceArea(): number
        {
            let diagonal: glMatrix.vec3 = glMatrix.vec3.subtract(glMatrix.vec3.create(), this.max, this.min);
            diagonal = glMatrix.vec3.fromValues(Math.abs(diagonal[0]), Math.abs(diagonal[1]), Math.abs(diagonal[2]));

            return ((diagonal[0] * diagonal[1]) + (diagonal[0] * diagonal[2]) + (diagonal[2] * diagonal[1])) * 2;
        }

        public calculateCenter(): void {
            this._center = glMatrix.vec3.add(glMatrix.vec3.create(), this.min, glMatrix.vec3.scale(glMatrix.vec3.create(), glMatrix.vec3.subtract(glMatrix.vec3.create(), this.max, this.min), 0.5));
        }
    }
// }