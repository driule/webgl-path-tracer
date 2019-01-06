namespace LH {

    export class Triangle {

        private _a: any;
        private _b: any;
        private _c: any;

        public constructor(a: any, b: any, c: any) {
            this._a = a;
            this._b = b;
            this._c = c;
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
    }
}