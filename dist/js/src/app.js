"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Renderer_1 = require("./Renderer");
var Gauge_1 = require("./utilities/Gauge");
var renderer;
var gauge;
// initialize application when page loading
window.onload = function () {
    gauge = new Gauge_1.Gauge();
    renderer = new Renderer_1.Renderer(gauge);
    renderer.start();
    // primitive count and FPS measurement
    var fpsLabel = document.getElementById('fps');
    var primitiveCountLabel = document.getElementById('primitiveCount');
    setInterval(function () {
        fpsLabel.innerHTML = gauge.fps.toFixed(1) + " fps";
        primitiveCountLabel.innerHTML = gauge.primitiveCount + " primitives loaded";
    }, 200);
    // control buttons event listeners
    addEventListeners();
    preventDefaultControls();
};
// handle keyboard input
document.onkeydown = function (event) {
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
function loadFile(filePath) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", filePath, false);
    xmlhttp.send(null);
    return xmlhttp.responseText;
}
exports.loadFile = loadFile;
function handleInput(command) {
    if (command == 'render') {
        renderer.resume();
        var start = Date.now();
        renderer.tick(Date.now() - start);
        var renderButton = document.getElementById(command);
        renderButton.disabled = true;
        var stopButton = document.getElementById('stop');
        stopButton.disabled = false;
    }
    else if (command == 'stop') {
        renderer.pause();
        var stopButton = document.getElementById(command);
        stopButton.disabled = true;
        var renderButton = document.getElementById('render');
        renderButton.disabled = false;
    }
    else if (command == 'changeScene1') {
        renderer.loadBasicScene();
    }
    else if (command == 'changeScene2') {
        renderer.loadTeddyScene();
    }
    else if (command == 'changeScene3') {
        renderer.loadTexturedScene();
    }
}
function onButtonDown(event) {
    var element = event.target;
    if (gauge.mouseDownId == 0) {
        if (element.id == 'moveUp') {
            gauge.mouseDownId = setInterval(function () { renderer.moveUp(); }, 100);
        }
        if (element.id == 'moveDown') {
            gauge.mouseDownId = setInterval(function () { renderer.moveDown(); }, 100);
        }
        if (element.id == 'moveLeft') {
            gauge.mouseDownId = setInterval(function () { renderer.moveLeft(); }, 100);
        }
        if (element.id == 'moveRight') {
            gauge.mouseDownId = setInterval(function () { renderer.moveRight(); }, 100);
        }
        if (element.id == 'zoomIn') {
            gauge.mouseDownId = setInterval(function () { renderer.zoomIn(); }, 100);
        }
        if (element.id == 'zoomOut') {
            gauge.mouseDownId = setInterval(function () { renderer.zoomOut(); }, 100);
        }
        if (element.id == 'rotateUp') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateUp(); }, 100);
        }
        if (element.id == 'rotateDown') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateDown(); }, 100);
        }
        if (element.id == 'rotateLeft') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateLeft(); }, 100);
        }
        if (element.id == 'rotateRight') {
            gauge.mouseDownId = setInterval(function () { renderer.rotateRight(); }, 100);
        }
    }
}
function onButtonUp(event) {
    clearInterval(gauge.mouseDownId);
    gauge.mouseDownId = 0;
}
function addEventListeners() {
    document.getElementById('moveUp').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveUp').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveUp').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveUp').addEventListener('touchend', onButtonUp, false);
    document.getElementById('moveDown').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveDown').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveDown').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveDown').addEventListener('touchend', onButtonUp, false);
    document.getElementById('moveLeft').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveLeft').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveLeft').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveLeft').addEventListener('touchend', onButtonUp, false);
    document.getElementById('moveRight').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('moveRight').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('moveRight').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('moveRight').addEventListener('touchend', onButtonUp, false);
    document.getElementById('zoomIn').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('zoomIn').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('zoomIn').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('zoomIn').addEventListener('touchend', onButtonUp, false);
    document.getElementById('zoomOut').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('zoomOut').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('zoomOut').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('zoomOut').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateUp').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateUp').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateUp').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateUp').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateDown').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateDown').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateDown').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateDown').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateLeft').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateLeft').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateLeft').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateLeft').addEventListener('touchend', onButtonUp, false);
    document.getElementById('rotateRight').addEventListener('mousedown', onButtonDown, false);
    document.getElementById('rotateRight').addEventListener('mouseup', onButtonUp, false);
    document.getElementById('rotateRight').addEventListener('touchstart', onButtonDown, false);
    document.getElementById('rotateRight').addEventListener('touchend', onButtonUp, false);
}
function preventDefaultControls() {
    window.addEventListener("keydown", function (e) {
        // space and arrow keys
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
}
//# sourceMappingURL=app.js.map