namespace LH {

    export class Sphere {

        public _center: Vector;
        public _radius: number;

        public constructor(center: Vector, radius: number) {
            this._center = center;
            this._radius = radius;
        }
    }
}