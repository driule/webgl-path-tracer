namespace LH {

    export class Light {

        public _temporaryTranslation: Vector;
        public _position: Vector;

        public constructor() {
            this._temporaryTranslation = Vector.create([0, 0, 0]);
            this._position = Vector.create([0.4, 0.5, -0.6]);
        }
    }
}