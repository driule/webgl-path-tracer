// namespace LH {
    
    export var gl: WebGL2RenderingContext;

    export class GLUtilities {

        public static initialize(canvasId: string): HTMLCanvasElement {

            let canvas = document.getElementById(canvasId) as HTMLCanvasElement;
            if (canvas === undefined) {
                throw new Error("Cannot find canvas element by id: " + canvasId);
            }

            // use WebGL 2.0
            gl = canvas.getContext("webgl2");

            if (gl === undefined) {
                throw new Error("Unable to initialize WebGL!");
            }
            // gl.getExtension('EXT_color_buffer_float');

            console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

            return canvas;
        }
    }
// }