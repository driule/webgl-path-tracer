import { Light } from "../geometry/Light";
import { vec3 } from "gl-matrix";
import { Camera } from "../Camera";
import { GeometryLoader } from "./GeometryLoader";
import { Scene } from "../Scene";
import { Triangle } from "../geometry/Triangle";

const parseHDR = require('parse-hdr');

export class SceneFactory  {

    private static async loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            let image: HTMLImageElement = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        });
    }

    private static async loadSkydome(src: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open("GET", src, true);
            request.responseType = "arraybuffer";
            request.onload = () => resolve(request.response);
            request.send(null);
        });
    }

    public static async createSponzaScene(canvas: HTMLCanvasElement) {
        console.log("Please wait! Loading sponza scene...");

        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 25.25), 0.25, 35.0),
            new Light(vec3.fromValues(45.25, 12.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-75.25, 20.75, 0.25), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.75, 15.75, 175.5], [0.0, 225.0, 0.0], 12.5);
        let geometry: any = await GeometryLoader.loadGltf("assets/models/sponza/", "Sponza.gltf");
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry["triangles"]);
    
        console.log("Scene loaded.");

        return scene;
    }

    public static async createAvocadoScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(-0.5, 2.75, 12.5), 0.25, 7.5),
            new Light(vec3.fromValues(2.25, 12.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-2.25, 2.75, -10.75), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.75, 10.75, 12.5], [0.0, 2.5, 0.0], 0.25);
        let geometry: any = await GeometryLoader.loadGltf("assets/models/avocado/", "Avocado.gltf", 100);
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry["triangles"]);

        scene.textureImage = await this.loadImage(geometry["textureImage"]);
        // scene.skydome = parseHDR(await this.loadSkydome("assets/skydome/space.hdr"));
    
        return scene;
    }
    
    public static async createDuckScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 3.0),
            new Light(vec3.fromValues(200.25, 22.75, -20.25), 1.5, 1.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 1.0)
        ];
        let camera = new Camera(canvas, [0.2, 0.75, 275.0], [0.0, 75.0, 0.0], 2.0);
        let geometry: any = await GeometryLoader.loadGltf("assets/models/duck/", "Duck.gltf");
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry["triangles"]);

        scene.textureImage = await this.loadImage(geometry["textureImage"]);
        scene.skydome = parseHDR(await this.loadSkydome("assets/skydome/LH/sky2.hdr"));
    
        return scene;
    }
    
    public static async createSuzanneScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 1.0),
            new Light(vec3.fromValues(200.25, 22.75, 0.25), 1.5, 1.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 1.5)
        ];
        let camera = new Camera(canvas, [0.2, 5.75, 2.5], [0.0, 0.0, 0.0], 0.05);
        let geometry: any = await GeometryLoader.loadGltf("assets/models/suzanne/", "Suzanne.gltf");
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry["triangles"]);

        scene.textureImage = await this.loadImage(geometry["textureImage"]);
        scene.skydome = parseHDR(await this.loadSkydome("assets/skydome/space.hdr"));
    
        return scene;
    }
    
    public static async createBasicScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 0.25), 0.25, 12.5),
        ];
        let camera = new Camera(canvas, [0.0, 0.0, 2.5]);
    
        let scene = new Scene(camera);
        scene.setLights(lights);
    
        scene.setTriangles([
            // ground plane
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(0.75, -0.95, 0.75), vec3.fromValues(0.75, -0.95, -0.75)),
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(-0.75, -0.95, 0.75), vec3.fromValues(0.75, -0.95, 0.75)),
    
            // left wall
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(-0.75, 0.95, 0.75), vec3.fromValues(-0.75, -0.95, 0.75)),
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(-0.75, 0.95, -0.75),  vec3.fromValues(-0.75, 0.95, 0.75)),
    
            // back wall
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(0.75, -0.95, -0.75), vec3.fromValues(-0.75, 0.95, -0.75)),
            new Triangle(vec3.fromValues(0.75, -0.95, -0.75), vec3.fromValues(0.75, 0.95, -0.75), vec3.fromValues(-0.75, 0.95, -0.75))
        ]);
    
        return scene;
    }
}