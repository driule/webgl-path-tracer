namespace LH {
    
    export class Sprite {
        private _width: number;
        private _height: number;
        private _position: Vector3;
        private _name: string;

        private _buffer: GLBuffer;


        public constructor(name: string, width: number = 100, height: number = 100, position: Vector3 = new Vector3()) {
            this._name = name;
            this._width = width;
            this._height = height;
            this._position = position;
        }

        public get position(): Vector3 {
            return this._position;
        }

        public set position(value: Vector3) {
            this._position = value;
        }

        public load(): void {
            this._buffer = new GLBuffer(3);
            
            let positionAttribute = new AttributeInformation();
            //positionAttribute.location = this._shader.getAttributeLocation("a_position");
            positionAttribute.location = 0;
            positionAttribute.offset = 0;
            positionAttribute.size = 3;
            this._buffer.addAttributeLocation(positionAttribute);

            let vertices = [
                // x, y, z

                0, 0, 0,
                0, this._height, 0,
                this._width, this._height, 0,

                this._width, this._height, 0,
                this._width, 0.0, 0,
                0, 0, 0
            ];

            this._buffer.pushBackData(vertices);
            this._buffer.upload();
            this._buffer.unbind();
        }

        public update(time: number): void {

        }

        public draw(): void {
            this._buffer.bind();
            this._buffer.draw();
        }
    }
}