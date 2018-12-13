
// entry point

let engine: LH.Engine;

window.onload = function() {
    engine = new LH.Engine();
    engine.start();
}

window.onresize = function() {
    engine.resize();
}