namespace LH {

    export class Light {

        public _position: any;

        public constructor() {
            this._position = glMatrix.vec3.create(0.4, 0.5, -0.6);
        }
    }
}