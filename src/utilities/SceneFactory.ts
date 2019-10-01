import { Light } from "../geometry/Light";
import { vec3 } from "gl-matrix";
import { Camera } from "../Camera";
import { GeometryLoader } from "./GeometryLoader";
import { Scene } from "../Scene";
import { Triangle } from "../geometry/Triangle";
import { Material } from "../geometry/Material";

export class SceneFactory  {
    
    public static async createPicaRoomScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(12.5, 27.5, 0.5), 0.25, 500.0),
        ];
        let camera = new Camera(canvas, vec3.fromValues(-1.05, 27.05, 42.5), -0.35,-3.15, 0.5);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/pica-room/", "scene.gltf", 0);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        scene.setSkydome(await GeometryLoader.parseHDR("assets/skydome/equi.hdr"));
        // scene.setSkydome(await GeometryLoader.parseHDR("assets/skydome/equi2.hdr"));

        return scene;
    }
    
    public static async createSponzaScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(825, 550, 305), 2.5, 250000.0),
            new Light(vec3.fromValues(825, 310, 372), 2.5, 250000.0),
            new Light(vec3.fromValues(0, 50, 0), 2.5, 250000.0),
            new Light(vec3.fromValues(0, 550, 0), 2.5, 250000.0)
        ];
        let camera = new Camera(canvas, vec3.fromValues(462.0, 350.0, 0), 0.01, -1.6, 10.0);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/sponza/", "Sponza.gltf", 0);
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        scene.setSkydome(await GeometryLoader.parseHDR("assets/skydome/sky1.hdr"));
    
        return scene;
    }

    public static async createAvocadoScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(-0.5, 2.75, 12.5), 0.25, 200.0),
            new Light(vec3.fromValues(2.25, 12.75, 0.25), 1.5, 200.0),
            new Light(vec3.fromValues(-2.25, 2.75, -10.75), 0.15, 250.0)
        ];
        let camera = new Camera(canvas, vec3.fromValues(-2.0, 1.5, -12.5), 0.1, 0.35, 0.25);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/avocado/", "Avocado.gltf", 0, 100);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        geometry = await GeometryLoader.loadGltf("assets/models/avocado/", "Avocado.gltf", scene.getMaterials().length, 100, vec3.fromValues(6.0, 0.0, 0.0));
        scene.addTriangles(geometry[0]);
        scene.addMaterials(geometry[1]);

        //scene.setSkydome(await GeometryLoader.parseHDR("assets/skydome/sky1.hdr"));
    
        return scene;
    }
    
    public static async createSuzanneScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(-20.25, 20.75, 0.25), 0.15, 1.5),
            new Light(vec3.fromValues(4.5, 3.85, 1.75), 0.25, 5.0),
        ];
        let camera = new Camera(canvas, vec3.fromValues(1.75, 0.9, 3.85), -0.15, 3.5, 0.1);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/suzanne/", "Suzanne.gltf", 0);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        scene.setSkydome(await GeometryLoader.parseHDR("assets/skydome/space.hdr"));
    
        return scene;
    }
    
    public static async createDuckScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 3.0),
            new Light(vec3.fromValues(200.25, 22.75, -20.25), 1.5, 1.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 1.0)
        ];
        let camera = new Camera(canvas, vec3.fromValues(215.0, 70.0, 205.0), 0.01, 3.85, 5.0);
        let geometry: [Triangle[], Material[]] = await GeometryLoader.loadGltf("assets/models/duck/", "Duck.gltf", 0);

        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(geometry[0]);
        scene.setMaterials(geometry[1]);

        scene.setSkydome(await GeometryLoader.parseHDR("assets/skydome/LH/sky2.hdr"));
    
        return scene;
    }
    
    public static async createBasicScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 0.25), 0.25, 12.5),
        ];
        let camera = new Camera(canvas);
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