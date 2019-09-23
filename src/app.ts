import { Renderer } from "./Renderer";
import { Gauge } from "./utilities/Gauge";
import { SceneFactory } from "./utilities/SceneFactory";
import { GLUtilities } from "./gl/GLUtilities";

let renderer: Renderer;
let gauge: Gauge;
let canvas: HTMLCanvasElement;
let loader: HTMLDivElement;

// initialize application when page loading
window.onload = async function() {
    canvas = GLUtilities.initialize("pathTracer");
    loader = document.getElementById("loader") as HTMLDivElement;
    gauge = new Gauge();
    
    renderer = new Renderer(canvas, gauge);
    setLoadingScreen();
    renderer.setScene(await SceneFactory.createAvocadoScene(canvas));
    removeLoadingScreen();

    // primitive count and FPS measurement
    let fpsLabel = document.getElementById("fps");
    let primitiveCountLabel = document.getElementById("primitiveCount");
    setInterval(function() {
        fpsLabel.innerHTML = gauge.getFps().toFixed(1) + " fps";
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

    // space
    if (event.keyCode == 32) {
        let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("stop");
        let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("render");

        if (renderButton.disabled) {
            stopButton.disabled = true;
            renderButton.disabled = false;
            renderer.stop();
        } else {
            stopButton.disabled = false;
            renderButton.disabled = true;
            renderer.start();
        }
    }
};

async function onButtonDown(event: MouseEvent) {
    let element: HTMLElement = <HTMLElement>event.target;

    if (gauge.mouseDownId == null) {
        if (element.id == "moveUp") {
            gauge.mouseDownId = setInterval(function() { renderer.moveUp(); }, 50);
        }
        if (element.id == "moveDown") {
            gauge.mouseDownId = setInterval(function() { renderer.moveDown(); }, 50);
        }
        if (element.id == "moveLeft") {
            gauge.mouseDownId = setInterval(function() { renderer.moveLeft(); }, 50);
        }
        if (element.id == "moveRight") {
            gauge.mouseDownId = setInterval(function() { renderer.moveRight(); }, 50);
        }
        if (element.id == "zoomIn") {
            gauge.mouseDownId = setInterval(function() { renderer.zoomIn(); }, 50);
        }
        if (element.id == "zoomOut") {
            gauge.mouseDownId = setInterval(function() { renderer.zoomOut(); }, 50);
        }
        if (element.id == "rotateUp") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateUp(); }, 50);
        }
        if (element.id == "rotateDown") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateDown(); }, 50);
        }
        if (element.id == "rotateLeft") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateLeft(); }, 50);
        }
        if (element.id == "rotateRight") {
            gauge.mouseDownId = setInterval(function() { renderer.rotateRight(); }, 50);
        }
        if (element.id == "render") {
            (<HTMLButtonElement>document.getElementById("render")).disabled = true;
            (<HTMLButtonElement>document.getElementById("stop")).disabled = false;

            renderer.start();
        } if (element.id == "stop") {
            (<HTMLButtonElement>document.getElementById("render")).disabled = false;
            (<HTMLButtonElement>document.getElementById("stop")).disabled = true;

            renderer.stop();
        } if (element.id == "changeScene1") {
            setLoadingScreen();
            renderer.setScene(await SceneFactory.createBasicScene(canvas));
            removeLoadingScreen();
        } if (element.id == "changeScene2") {
            setLoadingScreen();
            renderer.setScene(await SceneFactory.createDuckScene(canvas));
            removeLoadingScreen();
        } if (element.id == "changeScene3") {
            setLoadingScreen();
            renderer.setScene(await SceneFactory.createSuzanneScene(canvas));
            removeLoadingScreen();
        } if (element.id == "changeScene4") {
            setLoadingScreen();
            renderer.setScene(await SceneFactory.createAvocadoScene(canvas));
            removeLoadingScreen();
        } if (element.id == "changeScene5") {
            setLoadingScreen();
            renderer.setScene(await SceneFactory.createSponzaScene(canvas));
            removeLoadingScreen();
        } if (element.id == "changeScene6") {
            setLoadingScreen();
            renderer.setScene(await SceneFactory.createPicaRoomScene(canvas));
            removeLoadingScreen();
        }
    }
}

function setLoadingScreen(): void {
    renderer.stop();
    canvas.style.display = "none";
    loader.style.display = "block";

    
    let buttons = document.getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
    }
    (<HTMLSelectElement>document.getElementById("canvasSizeSelect")).disabled = true;
}

function removeLoadingScreen(): void {
    renderer.start();
    canvas.style.display = "block";
    loader.style.display = "none";

    let buttons = document.getElementsByTagName("button");
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = false;
    }

    (<HTMLButtonElement>document.getElementById("render")).disabled = true;
    (<HTMLSelectElement>document.getElementById("canvasSizeSelect")).disabled = false;
}

function onButtonUp(event: MouseEvent): void {
    clearInterval(gauge.mouseDownId);
    gauge.mouseDownId = null;
}

async function resizeCanvas() {
    let rendererElement = document.getElementById("renderer") as HTMLDivElement;
    let selectBox = document.getElementById("canvasSizeSelect") as HTMLSelectElement;
    let dimensions = selectBox.options[selectBox.selectedIndex].value.split(":", 2);

    canvas.width = +dimensions[0];
    canvas.height = +dimensions[1];

    rendererElement.style.width = dimensions[0] + "px";
    rendererElement.style.height = dimensions[1] + "px";

    renderer.resize(canvas);

    setLoadingScreen();
    renderer.setScene(await SceneFactory.createBasicScene(canvas));
    removeLoadingScreen();
}

function addEventListeners(): void {
    (<HTMLSelectElement>document.getElementById("canvasSizeSelect")).addEventListener("change", resizeCanvas, false);

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

    (<HTMLButtonElement>document.getElementById("changeScene6")).addEventListener("mousedown", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene6")).addEventListener("mouseup", onButtonUp, false);
    (<HTMLButtonElement>document.getElementById("changeScene6")).addEventListener("touchstart", onButtonDown, false);
    (<HTMLButtonElement>document.getElementById("changeScene6")).addEventListener("touchend", onButtonUp, false);

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