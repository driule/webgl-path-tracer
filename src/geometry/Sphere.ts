namespace LH {

    export class Sphere {

        public _center: Vector;
        public _radius: number;
        //private _centerStr: string;
        //private _radiusStr: string;
        //private _intersectStr: string;
        //private _temporaryTranslation: Vector;

        public constructor(center: Vector, radius: number) {
            this._center = center;
            this._radius = radius;
            //this._centerStr = 'sphereCenter' + id;
            //this._radiusStr = 'sphereRadius' + id;
            //this._intersectStr = 'tSphere' + id;
            //this._temporaryTranslation = Vector.create([0, 0, 0]);
        }

        /*public getGlobalCode(): string {
            return '' +
                ' uniform vec3 ' + this._centerStr + ';' +
                ' uniform float ' + this._radiusStr + ';'
            ;
        }
          
        public getIntersectCode(): string {
            return '' +
                ' float ' + this._intersectStr + ' = intersectSphere(origin, ray, ' + this._centerStr + ', ' + this._radiusStr + ');'
            ;
        }
          
        public getShadowTestCode(): string {
            return '' +
                this.getIntersectCode() + 
                ' if(' + this._intersectStr + ' < 1.0) return 0.0;'
            ;
        }
          
        public getMinimumIntersectCode(): string {
            return ' if(' + this._intersectStr + ' < t) t = ' + this._intersectStr + ';';
        }
          
        public getNormalCalculationCode(): string {
            return ' else if(t == ' + this._intersectStr + ') normal = normalForSphere(hit, ' + this._centerStr + ', ' + this._radiusStr + ');';
        }
          
        public setUniforms(pathTracer: PathTracer): void {
            pathTracer.uniforms[this._centerStr] = this._center.add(this._temporaryTranslation);
            pathTracer.uniforms[this._radiusStr] = this._radius;
        }*/
    }
}