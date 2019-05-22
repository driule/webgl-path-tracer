import { Light } from "../geometry/Light";
import { vec3 } from "gl-matrix";
import { Camera } from "../Camera";
import { GeometryLoader } from "./GeometryLoader";
import { Scene } from "../Scene";
import { Triangle } from "../geometry/Triangle";

export class SceneFactory  {

    static async createSponzaScene(canvas: HTMLCanvasElement) {
        console.log("Please wait! Loading sponza scene...");

        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 25.25), 0.25, 35.0),
            new Light(vec3.fromValues(45.25, 12.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-75.25, 20.75, 0.25), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.75, 15.75, 175.5], [0.0, 225.0, 0.0], 12.5);
        let triangles = await GeometryLoader.loadGltf("assets/models/sponza/Sponza.gltf");
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(triangles);
    
        console.log("Scene loaded.");

        return scene;
    }

    static async createAvocadoScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 1.75, 2.25), 0.25, 35.0),
            new Light(vec3.fromValues(2.25, 12.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-12.25, 20.75, 0.25), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.75, 15.75, 12.5], [0.0, 2.5, 0.0], 0.25);
        let triangles = await GeometryLoader.loadGltf("assets/models/avocado/Avocado.gltf", 100);
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(triangles);
    
        return scene;
    }
    
    static async createDuckScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 35.0),
            new Light(vec3.fromValues(200.25, 22.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.2, 0.75, 275.0], [0.0, 75.0, 0.0], 2.0);
        let triangles = await GeometryLoader.loadGltf("assets/models/duck/Duck.gltf");
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(triangles);
    
        return scene;
    }
    
    static async createBottleScene(canvas: HTMLCanvasElement) {
        let lights: Light[] = [
            new Light(vec3.fromValues(0.0, 5.75, 200.25), 0.25, 35.0),
            new Light(vec3.fromValues(200.25, 22.75, 0.25), 1.5, 10.0),
            new Light(vec3.fromValues(-20.25, 200.75, 0.25), 0.15, 15.0)
        ];
        let camera = new Camera(canvas, [0.2, 5.75, 0.5], [0.0, 0.0, 0.0], 0.05);
        let triangles = await GeometryLoader.loadGltf("assets/models/bottle/WaterBottle.gltf");
    
        let scene = new Scene(camera);
        scene.setLights(lights);
        scene.setTriangles(triangles);
    
        return scene;
    }
    
    static async createBasicScene(canvas: HTMLCanvasElement) {
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