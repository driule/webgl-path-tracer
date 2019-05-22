import { Renderer } from "./Renderer";
import { Gauge } from "./utilities/Gauge";
import { SceneFactory } from "./utilities/SceneFactory";
import { GLUtilities } from "./gl/GLUtilities";

let renderer: Renderer;
let gauge: Gauge;
let canvas: HTMLCanvasElement;

// initialize application when page loading
window.onload = async function() {
    canvas = GLUtilities.initialize("pathTracer");
    gauge = new Gauge();
    renderer = new Renderer(canvas, gauge);
    renderer.setScene(await SceneFactory.createBottleScene(canvas));

    // ToDO: check why some triangles are missing in the duck scene view
    // renderer.setScene(await SceneFactory.createDuckScene(canvas));

    renderer.start();

    // primitive count and FPS measurement
    let fpsLabel = document.getElementById("fps");
    let primitiveCountLabel = document.getElementById("primitiveCount");
    setInterval(function() {
        fpsLabel.innerHTML = gauge.fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = gauge.primitiveCount + " primitives loaded";
    }, 200);

    // control buttons event listeners
    addEventListeners();
}

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

async function onButtonDown(event: MouseEvent) {
    let element: HTMLElement = <HTMLElement>event.target;

    if (gauge.mouseDownId == null) {
        if (element.id == "moveUp") {
            gauge.mouseDownId = setInterval(function() { renderer.moveUp(); }, 100);
        }
        if (element.id == "moveDown") {
            gauge.mouseDownId = setInterval(function() { renderer.moveDown(); }, 100);
        }
        if (element.id == "moveLeft") {
            gauge.mouseDownId = setInterval(function() { renderer.moveLeft(); }, 100);
        }
        if (element.id == "moveRight") {
            gauge.mouseDownId = setInterval(function() { renderer.moveRight(); }, 100);
        }
        if (element.id == "zoomIn") {
            gauge.mouseDownId = setInterval(function() { renderer.zoomIn(); }, 100);
        }
        if (element.id == "zoomOut") {
            gauge.mouseDownId = setInterval(function() { renderer.zoomOut(); }, 100);
        }
        if (element.id == "rotateUp") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateUp(); }, 100);
        }
        if (element.id == "rotateDown") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateDown(); }, 100);
        }
        if (element.id == "rotateLeft") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateLeft(); }, 100);
        }
        if (element.id == "rotateRight") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateRight(); }, 100);
        }
        if (element.id == "render") {
            let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById(element.id);
            let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("stop");
            renderButton.disabled = true;
            stopButton.disabled = false;

            renderer.resume();
            let start = Date.now();
            renderer.tick(Date.now() - start);
    
        } if (element.id == "stop") {
            let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById(element.id);
            let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("render");
            stopButton.disabled = true;
            renderButton.disabled = false;

            renderer.pause();
        } if (element.id == "changeScene1") {
            renderer.setScene(await SceneFactory.createBasicScene(canvas));
        } if (element.id == "changeScene2") {
            renderer.setScene(await SceneFactory.createDuckScene(canvas));
        } if (element.id == "changeScene3") {
            renderer.setScene(await SceneFactory.createBottleScene(canvas));
        } if (element.id == "changeScene4") {
            renderer.setScene(await SceneFactory.createAvocadoScene(canvas));
        } if (element.id == "changeScene5") {
            renderer.setScene(await SceneFactory.createSponzaScene(canvas));
        }
    }
}

function onButtonUp(event: MouseEvent): void {
    clearInterval(gauge.mouseDownId);
    gauge.mouseDownId = null;
}

function addEventListeners(): void {
    (<HTMLButtonElement>document.getElementById("moveUp")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveUp")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("moveUp")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveUp")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("moveDown")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveDown")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("moveDown")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveDown")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("moveLeft")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveLeft")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("moveLeft")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveLeft")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("moveRight")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveRight")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("moveRight")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("moveRight")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("zoomIn")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("zoomIn")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("zoomIn")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("zoomIn")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("zoomOut")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("zoomOut")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("zoomOut")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("zoomOut")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("rotateUp")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateUp")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("rotateUp")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateUp")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("rotateDown")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateDown")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("rotateDown")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateDown")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("rotateLeft")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateLeft")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("rotateLeft")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateLeft")).addEventListener("touchend", onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById("rotateRight")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateRight")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("rotateRight")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("rotateRight")).addEventListener("touchend", onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById("render")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("render")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("render")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("render")).addEventListener("touchend", onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById("stop")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("stop")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("stop")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("stop")).addEventListener("touchend", onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById("changeScene1")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene1")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("changeScene1")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene1")).addEventListener("touchend", onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById("changeScene2")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene2")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("changeScene2")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene2")).addEventListener("touchend", onButtonUp, false);
    
    (<HTMLButtonElement>document.getElementById("changeScene3")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene3")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("changeScene3")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene3")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("changeScene4")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene4")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("changeScene4")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene4")).addEventListener("touchend", onButtonUp, false);

    (<HTMLButtonElement>document.getElementById("changeScene5")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene5")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("changeScene5")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene5")).addEventListener("touchend", onButtonUp, false);

    preventDefaultControls();
}

function preventDefaultControls(): void {
    window.addEventListener("keydown", function(e) {
        // space and arrow keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
}