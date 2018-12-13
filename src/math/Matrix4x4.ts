namespace LH {

    export class Matrix4x4 {
        
        private _data: number[] = [];

        private constructor() {
            this._data = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ];
        }

        public get data(): number[] {
            return this._data;
        }

        public static identity(): Matrix4x4 {
            return new Matrix4x4();
        }

        public static orthographic(
            left: number,
            right: number,
            bottom: number,
            top: number,
            nearClip: number,
            farClip :number
        ): Matrix4x4 {
            let matrix = new Matrix4x4();

            let lr: number = 1.0 / (left - right);
            let bt: number = 1.0 / (bottom - top);
            let nf: number = 1.0 / (nearClip - farClip);

            matrix._data[0] = -2.0 * lr;
            matrix._data[5] = -2.0 * bt;
            matrix._data[11] = 2.0 * nf;

            matrix._data[12] = (left + right) * lr;
            matrix._data[13] = (bottom + top) * bt;
            matrix._data[14] = (nearClip + farClip) * nf;

            return matrix;
        }

        public static translation(position: Vector3): Matrix4x4 {
            let matrix = new Matrix4x4();

            matrix._data[12] = position.x;
            matrix._data[13] = position.y;
            matrix._data[14] = position.z;

            return matrix;
        }
    }
}