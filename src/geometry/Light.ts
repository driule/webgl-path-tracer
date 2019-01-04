namespace LH {

    export class Light {

        private _temporaryTranslation: Vector;
        private _position: Vector;

        public constructor() {
            this._temporaryTranslation = Vector.create([0, 0, 0]);

            this._position = Vector.create([0.4, 0.5, -0.6]);
        }

        public getGlobalCode(): string {
            return 'uniform vec3 light;';
        }
          
        public getIntersectCode(): string {
            return '';
        }
          
        public getShadowTestCode(): string {
            return '';
        }
          
        public getMinimumIntersectCode(): string {
            return '';
        }
          
        public getNormalCalculationCode(): string {
            return '';
        }
          
        public setUniforms(pathTracer: PathTracer): void {
            pathTracer.uniforms.light = this._position.add(this._temporaryTranslation);
        }
          
        public clampPosition(position): void {
            for(var i = 0; i < position.elements.length; i++) {
              position.elements[i] = Math.max(lightSize - 1, Math.min(1 - lightSize, position.elements[i]));
            }
        }
          
        public temporaryTranslate(translation: Vector) {
            var tempLight = this._position.add(translation);
            this.clampPosition(tempLight);
            this._temporaryTranslation = tempLight.subtract(this._position);
        }
          
        public translate(translation: Vector) {
            this._position = this._position.add(translation);
            this.clampPosition(this._position);
        }
          
        public getMinCorner() {
            return this._position.add(this._temporaryTranslation).subtract(Vector.create([lightSize, lightSize, lightSize]));
        }
          
        public getMaxCorner() {
            return this._position.add(this._temporaryTranslation).add(Vector.create([lightSize, lightSize, lightSize]));
        }
          
        public intersect(origin, ray) {
            return Number.MAX_VALUE;
        }
    }
}