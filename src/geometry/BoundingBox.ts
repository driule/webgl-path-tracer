namespace LH {

    export class BoundingBox {

        private _id: number;

        public min: any; // vec3
        public max: any; // vec3
        public center: any; // vec3

        public isLeaf: boolean;
        public left: BoundingBox;
        public right: BoundingBox;
        public first: number;
        public count: number;

        public constructor(id: number) {
            this._id = id;
        }

        public get id(): number {
            return this._id;
        }

        public calculateSurfaceArea(): number
        {
            let diagonal = glMatrix.vec3.subtract([], this.max, this.min);
            diagonal = [Math.abs(diagonal[0]), Math.abs(diagonal[1]), Math.abs(diagonal[2])];

            return ((diagonal[0] * diagonal[1]) + (diagonal[0] * diagonal[2]) + (diagonal[2] * diagonal[1])) * 2;
        }

        public calculateCenter(): void {
            this.center = glMatrix.vec3.add([], this.min, glMatrix.vec3.scale([], glMatrix.vec3.subtract([], this.max, this.min), 0.5));
        }
    }
}