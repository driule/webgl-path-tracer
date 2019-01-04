namespace LH {

    export class Light {

        private _temporaryTranslation: Vector;

        public constructor() {
            this._temporaryTranslation = Vector.create([0, 0, 0]);
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
          
        public setUniforms(renderer): void {
            renderer.uniforms.light = light.add(this._temporaryTranslation);
        }
          
        public clampPosition(position): void {
            for(var i = 0; i < position.elements.length; i++) {
              position.elements[i] = Math.max(lightSize - 1, Math.min(1 - lightSize, position.elements[i]));
            }
        }
          
        public temporaryTranslate(translation) {
            var tempLight = light.add(translation);
            this.clampPosition(tempLight);
            this._temporaryTranslation = tempLight.subtract(light);
        }
          
        public translate(translation) {
            light = light.add(translation);
            this.clampPosition(light);
        }
          
        public getMinCorner() {
            return light.add(this._temporaryTranslation).subtract(Vector.create([lightSize, lightSize, lightSize]));
        }
          
        public getMaxCorner() {
            return light.add(this._temporaryTranslation).add(Vector.create([lightSize, lightSize, lightSize]));
        }
          
        public intersect(origin, ray) {
            return Number.MAX_VALUE;
        }
    }
}