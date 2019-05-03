namespace LH {

    export class Triangle {

        private _a: any;
        private _b: any;
        private _c: any;

        private _boundingBox: BoundingBox;

        public constructor(a: any, b: any, c: any) {
            this._a = a;
            this._b = b;
            this._c = c;

            let minX = Math.min(Math.min(this.a[0], this.b[0]), this.c[0]);
            let minY = Math.min(Math.min(this.a[1], this.b[1]), this.c[1]);
            let minZ = Math.min(Math.min(this.a[2], this.b[2]), this.a[2]);
        
            let maxX = Math.max(Math.max(this.a[0], this.b[0]), this.c[0]);
            let maxY = Math.max(Math.max(this.a[1], this.b[1]), this.c[1]);
            let maxZ = Math.max(Math.max(this.a[2], this.b[2]), this.a[2]);
        
            this._boundingBox = new BoundingBox();
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
}