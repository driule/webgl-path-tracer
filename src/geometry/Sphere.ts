namespace LH {

    export class Sphere {

        private _center: any;
        private _radius: number;

        public constructor(center: any, radius: number) {
            this._center = center;
            this._radius = radius;
        }

        public get center(): any {
            return this._center;
        }

        public get radius(): number {
            return this._radius;
        }
    }
}