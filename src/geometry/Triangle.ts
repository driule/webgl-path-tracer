// namespace LH {

    import { BoundingBox } from "./BoundingBox";

    export class Triangle {

        private _a: any;
        private _b: any;
        private _c: any;

        private _boundingBox: BoundingBox;

        public constructor(a: any, b: any, c: any) {
            this._a = a;
            this._b = b;
            this._c = c;

            let minX = Math.min(this._a[0], this._b[0], this._c[0]);
            let minY = Math.min(this._a[1], this._b[1], this._c[1]);
            let minZ = Math.min(this._a[2], this._b[2], this._c[2]);

            let maxX = Math.max(this._a[0], this._b[0], this._c[0]);
            let maxY = Math.max(this._a[1], this._b[1], this._c[1]);
            let maxZ = Math.max(this._a[2], this._b[2], this._c[2]);
        
            this._boundingBox = new BoundingBox(0);
            this._boundingBox.min = [minX, minY, minZ];
            this._boundingBox.max = [maxX, maxY, maxZ];
            this._boundingBox.calculateCenter();
        }

        public get a(): any {
            return this._a;
        }

        public get b(): number {
            return this._b;
        }

        public get c(): number {
            return this._c;
        }

        public get boundingBox(): BoundingBox {
            return this._boundingBox;
        }
    }
// }