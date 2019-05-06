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
    if (event.keyCode == 189 || event.keyCode == 109) {
        renderer.zoomOut();
    }

    // +
    if (event.keyCode == 187 || event.keyCode == 107) {
        renderer.zoomIn();
    }
};