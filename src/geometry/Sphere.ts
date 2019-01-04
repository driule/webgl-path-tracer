namespace LH {

    export class Sphere {

        private _center: Vector;
        private _radius: number;
        private _centerStr: string;
        private _radiusStr: string;
        private _intersectStr: string;
        private _temporaryTranslation: Vector;

        public constructor(center, radius: number, id: number) {
            this._center = center;
            this._radius = radius;
            this._centerStr = 'sphereCenter' + id;
            this._radiusStr = 'sphereRadius' + id;
            this._intersectStr = 'tSphere' + id;
            this._temporaryTranslation = Vector.create([0, 0, 0]);
        }

        public getGlobalCode(): string {
            return '' +
          ' uniform vec3 ' + this._centerStr + ';' +
          ' uniform float ' + this._radiusStr + ';';
        }
          
        public getIntersectCode(): string {
            return '' +
          ' float ' + this._intersectStr + ' = intersectSphere(origin, ray, ' + this._centerStr + ', ' + this._radiusStr + ');';
        }
          
        public getShadowTestCode(): string {
            return '' +
            this.getIntersectCode() + 
          ' if(' + this._intersectStr + ' < 1.0) return 0.0;';
        }
          
        public getMinimumIntersectCode(): string {
            return '' +
          ' if(' + this._intersectStr + ' < t) t = ' + this._intersectStr + ';';
        }
          
        public getNormalCalculationCode(): string {
            return '' +
          ' else if(t == ' + this._intersectStr + ') normal = normalForSphere(hit, ' + this._centerStr + ', ' + this._radiusStr + ');';
        }
          
        public setUniforms(renderer): void {
            renderer.uniforms[this._centerStr] = this._center.add(this._temporaryTranslation);
            renderer.uniforms[this._radiusStr] = this._radius;
        }
          
        public temporaryTranslate(translation): void {
            this._temporaryTranslation = translation;
        }
          
        public translate(translation): void {
            this._center = this._center.add(translation);
        }
          
        public getMinCorner() {
            return this._center.add(this._temporaryTranslation).subtract(Vector.create([this._radius, this._radius, this._radius]));
        }
          
        public getMaxCorner() {
            return this._center.add(this._temporaryTranslation).add(Vector.create([this._radius, this._radius, this._radius]));
        }
        
        public intersect(origin, ray, center, radius): number {
            var toSphere = origin.subtract(center);
            var a = ray.dot(ray);
            var b = 2 * toSphere.dot(ray);
            var c = toSphere.dot(toSphere) - radius * radius;
            var discriminant = b * b - 4 * a * c;
            if (discriminant > 0) {
                var t = (-b - Math.sqrt(discriminant)) / (2*a);
                if(t > 0) {
                    return t;
                }
            }

            return Number.MAX_VALUE;
        }
    }
}