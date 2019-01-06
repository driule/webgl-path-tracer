namespace LH {

    export class Light {

        private _position: any;
        private _radius: number;
        private _intensity: number;

        public constructor(position: any, radius: number, intensity: number) {
            this._position = position;
            this._radius = radius;
            this._intensity = intensity;
        }

        public get position(): any {
            return this._position;
        }

        public get radius(): any {
            return this._radius;
        }

        public get intensity(): any {
            return this._intensity;
        }
    }
}