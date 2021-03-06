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

        console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

        return canvas;
    }

    public static detectDevice(): string {
        let debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        let vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        let renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        console.log("detected device:", vendor + " " + renderer);

        return vendor + " " + renderer;
    }
}
