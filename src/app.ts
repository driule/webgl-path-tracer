declare var glMatrix: any;

function loadFile(filePath: string): string {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send(null);

    return xmlhttp.responseText;
}

let renderer: LH.Renderer;

// fps measurement
var lastTick: number = Date.now();
var fps: number = 0;
var elapsedTime = 0;
var frameCount = 0;

var primitiveCount = 0;

window.onload = function() {
    renderer = new LH.Renderer();
    renderer.start();

    let start = Date.now();
    renderer.tick(Date.now() - start);

    // TODO: always use requestAnimationFrame() over setInterval()
    //setInterval(function(){ renderer.tick((Date.now() - start) * 0.001); }, 1000 / 60);

    var fpsLabel = document.getElementById('fps');
    var primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function() {
        fpsLabel.innerHTML = fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = primitiveCount + " primitives loaded";
    }, 200);
}

function handleInput(command: string): void {

    if (command == 'render') {
        renderer.resume();
        let start = Date.now();
        renderer.tick(Date.now() - start);

        let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById(command);
        renderButton.disabled = true;
        let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('stop');
        stopButton.disabled = false;

    } else if (command == 'stop') {
        renderer.pause();

        let stopButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById(command);
        stopButton.disabled = true;
        let renderButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('render');
        renderButton.disabled = false;
    } else if (command == 'rotateUp') {
        renderer.rotateUp();
    } else if (command == 'rotateDown') {
        renderer.rotateDown();
    } else if (command == 'rotateLeft') {
        renderer.rotateLeft();
    } else if (command == 'rotateRight') {
        renderer.rotateRight();
    } else if (command == 'zoomIn') {
        renderer.zoomIn();
    } else if (command == 'zoomOut') {
        renderer.zoomOut();
    } else if (command == 'moveUp') {
        renderer.moveUp();
    } else if (command == 'moveDown') {
        renderer.moveDown();
    } else if (command == 'moveLeft') {
        renderer.moveLeft();
    } else if (command == 'moveRight') {
        renderer.moveRight();
    } else if (command == 'moveForward') {
        renderer.moveForward();
    } else if (command == 'moveBack') {
        renderer.moveBack();
    }
}

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

    // // numpad -
    // if (event.keyCode == 109) {
    //     renderer.moveBack();
    // }

    // // numpad +
    // if (event.keyCode == 107) {
    //     renderer.moveForward();
    // }
};