declare var glMatrix: any;

let renderer: LH.Renderer;

// global variables
var lastTick: number = Date.now();
var fps: number = 0;
var elapsedTime: number = 0;
var frameCount: number = 0;
var primitiveCount: number = 0;
var mouseDownId: number = 0;

// initialize application when page loading
window.onload = function() {
    renderer = new LH.Renderer();
    renderer.start();

    let start = Date.now();
    renderer.tick(Date.now() - start);

    // TODO: always use requestAnimationFrame() over setInterval()
    //setInterval(function(){ renderer.tick((Date.now() - start) * 0.001); }, 1000 / 60);

    // TODO: encapsulate FPS measurement !!!
    var fpsLabel = document.getElementById('fps');
    var primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function() {
        fpsLabel.innerHTML = fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = primitiveCount + " primitives loaded";
    }, 200);

    // control buttons event listeners
    addEventListeners();
    preventDefaultControls();
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

function loadFile(filePath: string): string {
    let xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send(null);

    return xmlhttp.responseText;
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
    }
}

function onButtonDown(event: MouseEvent): void {
    let element: HTMLElement = <HTMLElement>event.target;

    if (mouseDownId == 0) {
        if (element.id == 'moveUp') {
            mouseDownId = setInterval(function() { renderer.moveUp(); }, 100);
        }
        if (element.id == 'moveDown') {
            mouseDownId = setInterval(function() { renderer.moveDown(); }, 100);
        }
        if (element.id == 'moveLeft') {
            mouseDownId = setInterval(function() { renderer.moveLeft(); }, 100);
        }
        if (element.id == 'moveRight') {
            mouseDownId = setInterval(function() { renderer.moveRight(); }, 100);
        }
        if (element.id == 'zoomIn') {
            mouseDownId = setInterval(function() { renderer.zoomIn(); }, 100);
        }
        if (element.id == 'zoomOut') {
            mouseDownId = setInterval(function() { renderer.zoomOut(); }, 100);
        }
        if (element.id == 'rotateUp') {
            mouseDownId = setInterval(function() { renderer.rotateUp(); }, 100);
        }
        if (element.id == 'rotateDown') {
            mouseDownId = setInterval(function() { renderer.rotateDown(); }, 100);
        }
        if (element.id == 'rotateLeft') {
            mouseDownId = setInterval(function() { renderer.rotateLeft(); }, 100);
        }
        if (element.id == 'rotateRight') {
            mouseDownId = setInterval(function() { renderer.rotateRight(); }, 100);
        }
    }
}

function onButtonUp(event: MouseEvent): void {
    clearInterval(mouseDownId);
    mouseDownId = 0;
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
}

function preventDefaultControls(): void {
    window.addEventListener("keydown", function(e) {
        // space and arrow keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
}