namespace LH {

    export class Renderer {

        private pathTracer: PathTracer;

        public constructor() {
              this.pathTracer = new PathTracer();
        }

        public setObjects(objects): void {
            this.pathTracer.setObjects(objects);
        }
          
        public update(modelviewProjection: Matrix, timeSinceStart: number): void {
            var jitter = Matrix.Translation(Vector.create([Math.random() * 2 - 1, Math.random() * 2 - 1, 0]).multiply(1 / 512));
            var inverse = jitter.multiply(modelviewProjection).inverse();
            this.pathTracer.update(inverse, timeSinceStart);
        }
          
        public render(): void {
            this.pathTracer.render();
        }
    }
}