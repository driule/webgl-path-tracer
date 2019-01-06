namespace LH {

    export class Light {

        private _position: any;

        public constructor(position: any = [0.4, 0.5, -0.6]) {
            this._position = position;
        }

        public get position(): any {
            return this._position;
        }
    }
}