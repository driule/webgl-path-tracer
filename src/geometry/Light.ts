namespace LH {

    export class Light {

        public _temporaryTranslation: Vector;
        public _position: Vector;

        public constructor() {
            this._temporaryTranslation = Vector.create([0, 0, 0]);
            this._position = Vector.create([0.4, 0.5, -0.6]);
        }

        /*public getGlobalCode(): string {
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
        }*/
    }
}