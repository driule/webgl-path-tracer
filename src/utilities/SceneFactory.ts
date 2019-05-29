import { Light } from "../geometry/Light";
import { vec3 } from "gl-matrix";
import { Camera } from "../Camera";
import { GeometryLoader } from "./GeometryLoader";
import { Scene } from "../Scene";
import { Triangle } from "../geometry/Triangle";
import { Material } from "../geometry/Material";

const parseHDR = require('parse-hdr');

export class SceneFactory  {

    public static async createSponzaScene(canvas: HTMLCanvasElement) {
        console.log("Please wait! Loading sponza scene...");

        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 25.25), 0.25, 5.0),
            new Light(vec3.fromValues(45.25, 12.75, 0.25), 1.5, 5.0),
            new Light(vec3.fromValues(-75.25, 20.75, 0.25), 0.15, 5.0)
        ];
        let camera = new Camera(canvas, [0.75, 15.75, 175.5], 5.0);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/sponza/", "Sponza.gltf", 0);
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);
    
        console.log("Scene loaded.");

        return scene;
    }

    public static async createAvocadoScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(-0.5, 2.75, 12.5), 0.25, 7.5),
            new Light(vec3.fromValues(2.25, 12.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-2.25, 2.75, -10.75), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.75, 10.75, 12.5], 0.05);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/avocado/", "Avocado.gltf", 0, 100);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        geometry = await GeometryLoader.loadGltf("assets/models/avocado/", "Avocado.gltf", scene.materials.length, 100, vec3.fromValues(6.0, 0.0, 0.0));
        scene.addTriangles(geometry[0]);
        scene.addMaterials(geometry[1]);

        // scene.skydome = parseHDR(await GeometryLoader.loadSkydome("assets/skydome/sky1.hdr"));
    
        return scene;
    }
    
    public static async createDuckScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 3.0),
            new Light(vec3.fromValues(200.25, 22.75, -20.25), 1.5, 1.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 1.0)
        ];
        let camera = new Camera(canvas, [0.2, 0.75, 275.0], 2.0);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/duck/", "Duck.gltf", 0);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        scene.skydome = parseHDR(await GeometryLoader.loadSkydome("assets/skydome/LH/sky2.hdr"));
    
        return scene;
    }
    
    public static async createSuzanneScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 1.0),
            new Light(vec3.fromValues(200.25, 22.75, 0.25), 1.5, 1.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 1.5)
        ];
        let camera = new Camera(canvas, [0.2, 5.75, 2.5], 0.05);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/suzanne/", "Suzanne.gltf", 0);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        scene.skydome = parseHDR(await GeometryLoader.loadSkydome("assets/skydome/space.hdr"));
    
        return scene;
    }
    
    public static async createBasicScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 0.25), 0.25, 12.5),
        ];
        let camera = new Camera(canvas, [0.0, 0.0, 2.5]);
        let material: Material = new Material(0);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles([
            // ground plane
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(0.75, -0.95, 0.75), vec3.fromValues(0.75, -0.95, -0.75), material),
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(-0.75, -0.95, 0.75), vec3.fromValues(0.75, -0.95, 0.75), material),
    
            // left wall
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(-0.75, 0.95, 0.75), vec3.fromValues(-0.75, -0.95, 0.75), material),
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(-0.75, 0.95, -0.75),  vec3.fromValues(-0.75, 0.95, 0.75), material),
    
            // back wall
            new Triangle(vec3.fromValues(-0.75, -0.95, -0.75), vec3.fromValues(0.75, -0.95, -0.75), vec3.fromValues(-0.75, 0.95, -0.75), material),
            new Triangle(vec3.fromValues(0.75, -0.95, -0.75), vec3.fromValues(0.75, 0.95, -0.75), vec3.fromValues(-0.75, 0.95, -0.75), material)
        ]);
        scene.setMaterials([material]);
    
        return scene;
    }
}