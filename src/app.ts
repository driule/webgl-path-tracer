import { Renderer } from "./Renderer";
import { Gauge } from "./utilities/Gauge";

import { GltfLoader, GltfAsset } from 'gltf-loader-ts';
import { Triangle } from "./geometry/Triangle";
import { vec3 } from "gl-matrix";
import { GeometryLoader } from "./utilities/GeometryLoader";

// var gltfUtilities: any;
declare var gltfUtilities: any;

let renderer: Renderer;
let gauge: Gauge;

// initialize application when page loading
window.onload = async function() {
    gauge = new Gauge();
    renderer = new Renderer(gauge);

    // let triangles = await GeometryLoader.loadGltf('assets/models/bottle/WaterBottle.gltf');
    let triangles = await GeometryLoader.loadGltf('assets/models/duck/Duck.gltf');

    renderer.start(triangles);

    // primitive count and FPS measurement
    let fpsLabel = document.getElementById('fps');
    let primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function() {
        fpsLabel.innerHTML = gauge.fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = gauge.primitiveCount + " primitives loaded";
    }, 200);

    // control buttons event listeners
    addEventListeners();
    preventDefaultControls();
}

// async function loadGLTF() {
//     let loader = new GltfLoader();
//     let uri = 'assets/models/duck/Duck.gltf';
    
//     let asset: GltfAsset = await loader.load(uri);
//     let vertexAccesorId = await asset.gltf.meshes[0].primitives[0].attributes['POSITION'];
//     let vertexData = await asset.accessorData(vertexAccesorId);

//     // create mesh vertices (parsin VEC3)
//     let meshVertices: vec3[] = [];
//     for (let i = 0; i < vertexData.length / 24; i++) {
//         let vertexValues = new Float32Array(vertexData.slice(vertexData.length / 2 + i * 12, vertexData.length / 2 + i * 12 + 12).buffer);
//         let vertex: vec3 = vec3.fromValues(vertexValues[0], vertexValues[1], vertexValues[2]);

//         meshVertices.push(vertex);
//     }

//     // create mesh vertex indices (parsing SCALAR)
//     let indicesAccesorId = await asset.gltf.meshes[0].primitives[0].indices;
//     let indicesData = await asset.accessorData(indicesAccesorId);
//     let meshIndices = new Uint16Array(indicesData.slice(0, indicesData.length).buffer);

//     // compose triangles
//     let triangles: Triangle[] = [];
//     for (let i = 0; i < meshIndices.length / 3; i++) {
//         let a: vec3 = meshVertices[meshIndices[i * 3 + 0]];
//         let b: vec3 = meshVertices[meshIndices[i * 3 + 1]];
//         let c: vec3 = meshVertices[meshIndices[i * 3 + 2]];

//         triangles.push(new Triangle(a, b, c));
//     }

//     return triangles;
// }

// handle keyboard input
document.onkeydown = function(event) {

    // W
    if (event.keyCode == 87) {
        renderer.moveUp();
    }

    // S
    if (event.keyCode == 83) {
        renderer.moveDown();
    }

    // A
    if (event.keyCode == 65) {
        renderer.moveLeft();
    }

    // D
    if (event.keyCode == 68) {
        renderer.moveRight();
    }

    // -
    if (event.keyCode == 189) {
        renderer.zoomOut();
    }

    // +
    if (event.keyCode == 187) {
        renderer.zoomIn();
    }
    
    // ArrowUp
    if (event.keyCode == 38) {
        renderer.rotateUp();
    }

    // ArrowDown
    if (event.keyCode == 40) {
        renderer.rotateDown();
    }

    // ArrowLeft
    if (event.keyCode == 37) {
        renderer.rotateLeft();
    }

    // ArrowRight
    if (event.keyCode == 39) {
        renderer.rotateRight();
    }

    // numpad -
    if (event.keyCode == 109) {
        renderer.zoomOut();
    }

    // numpad +
    if (event.keyCode == 107) {
        renderer.zoomIn();
    }
};

function onButtonDown(event: MouseEvent): void {
    let element: HTMLElement = <HTMLElement>event.target;

    if (gauge.mouseDownId == null) {
        if (element.id == 'moveUp') {
            gauge.mouseDownId = setInterval(function() { renderer.moveUp(); }, 100);
        }
        if (element.id == 'moveDown') {
            gauge.mouseDownId = setInterval(function() { renderer.moveDown(); }, 100);
        }
        if (element.id == 'moveLeft') {
            gauge.mouseDownId = setInterval(function() { renderer.moveLeft(); }, 100);
        }
        if (element.id == 'moveRight') {
            gauge.mouseDownId = setInterval(function() { renderer.moveRight(); }, 100);
        }
        if (element.id == 'zoomIn') {
            gauge.mouseDownId = setInterval(function() { renderer.zoomIn(); }, 100);
        }
        if (element.id == 'zoomOut') {
            gauge.mouseDownId = setInterval(function() { renderer.zoomOut(); }, 100);
        }
        if (element.id == 'rotateUp') {
            gauge.mouseDownId = setInterval(function() { renderer.rotateUp(); }, 100);
        }
        if (element.id == 'rotateDown') {
            gauge.mouseDownId = setInterval(function() { renderer.rotateDown(); }, 100);
        }
        if (element.id == 'rotateLeft') {
            gauge.mouseDownId = setInterval(function() { renderer.rotateLeft(); }, 100);
        }
        if (element.id == 'rotateRight') {
            gauge.mouseDownId = setInterval(function() { renderer.rotateRight(); }, 100);
        }
        if (element.id == 'render') {
            let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById(element.id);
            let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('stop');
            renderButton.disabled = true;
            stopButton.disabled = false;

            renderer.resume();
            let start = Date.now();
            renderer.tick(Date.now() - start);
    
        } if (element.id == 'stop') {
            let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById(element.id);
            let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('render');
            stopButton.disabled = true;
            renderButton.disabled = false;

            renderer.pause();
        } if (element.id == 'changeScene1') {
            renderer.loadBasicScene();
        } if (element.id == 'changeScene2') {
            // renderer.loadTeddyScene();
        } if (element.id == 'changeScene3') {
            renderer.loadTexturedScene();
        }
    }
}

function onButtonUp(event: MouseEvent): void {
    clearInterval(gauge.mouseDownId);
    gauge.mouseDownId = null;
}

function addEventListeners(): void {
    (<HTMLButtonElement>document.getElementById('moveUp')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveUp')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('moveUp')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveUp')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('moveDown')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveDown')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('moveDown')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveDown')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('moveLeft')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveLeft')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('moveLeft')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveLeft')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('moveRight')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveRight')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('moveRight')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('moveRight')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('zoomIn')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('zoomIn')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('zoomIn')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('zoomIn')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('zoomOut')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('zoomOut')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('zoomOut')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('zoomOut')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('rotateUp')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateUp')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('rotateUp')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateUp')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('rotateDown')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateDown')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('rotateDown')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateDown')).addEventListener('touchend', onButtonUp, false);

    (<HTMLButtonElement>document.getElementById('rotateLeft')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateLeft')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('rotateLeft')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateLeft')).addEventListener('touchend', onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById('rotateRight')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateRight')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('rotateRight')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('rotateRight')).addEventListener('touchend', onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById('render')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('render')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('render')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('render')).addEventListener('touchend', onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById('stop')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('stop')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('stop')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('stop')).addEventListener('touchend', onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById('changeScene1')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('changeScene1')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('changeScene1')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('changeScene1')).addEventListener('touchend', onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById('changeScene2')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('changeScene2')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('changeScene2')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('changeScene2')).addEventListener('touchend', onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById('changeScene3')).addEventListener('mousedown', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('changeScene3')).addEventListener('mouseup', onButtonUp, false);
    (<HTMLButtonElement>document.getElementById('changeScene3')).addEventListener('touchstart', onButtonDown, false);
    (<HTMLButtonElement>document.getElementById('changeScene3')).addEventListener('touchend', onButtonUp, false);
}

function preventDefaultControls(): void {
    window.addEventListener("keydown", function(e) {
        // space and arrow keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
}