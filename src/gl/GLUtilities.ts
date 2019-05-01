namespace LH {
    
    export var gl: WebGLRenderingContext;

    export class GLUtilities {

        public static initialize(canvasId: string): HTMLCanvasElement {

            let canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            if (canvas === undefined) {
                throw new Error("Cannot find canvas element by id: " + canvasId);
            }

            gl = canvas.getContext("webgl2");
            // gl = canvas.getContext("webgl");
            if (gl === undefined) {
                throw new Error("Unable to initialize WebGL!");
            }

            console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

            return canvas;
        }
    }
}