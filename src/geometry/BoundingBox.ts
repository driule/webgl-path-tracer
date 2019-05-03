namespace LH {

    export class BoundingBox {

        public min: any;
        public max: any;
        public center: any;

        public isLeaf: boolean;
        public left: BoundingBox;
        public right: BoundingBox;
        public first: number
        public count: number;

        // public constructor() {
        // }

        // public constructor(min: any, max: any) {
        //     this.min = min;
        //     this.max = max;
        // }

        public calculateSurfaceArea(): number
        {
            let diagonal = glMatrix.vec3.subtract([], this.max, this.min);
            diagonal = [Math.abs(diagonal[0]), Math.abs(diagonal[1]), Math.abs(diagonal[2])];

            return ((diagonal[0] * diagonal[1]) + (diagonal[0] * diagonal[2]) + (diagonal[2] * diagonal[1])) * 2;
        }

        public calculateCenter(): void {
            // this.center = this.min + 0.5 * (this.max - this.min);

            this.center = glMatrix.vec3.add([], this.min, glMatrix.vec3.scale([], glMatrix.vec3.subtract([], this.max, this.min), 0.5));
        }
    }
}