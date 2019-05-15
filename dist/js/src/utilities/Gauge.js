var LH;
(function (LH) {
    var Gauge = /** @class */ (function () {
        function Gauge() {
            this.primitiveCount = 0;
            this.mouseDownId = 0;
            this._fps = 0;
            this._lastTick = Date.now();
            this._elapsedTime = 0;
            this._frameCount = 0;
        }
        Object.defineProperty(Gauge.prototype, "fps", {
            get: function () {
                return this._fps;
            },
            enumerable: true,
            configurable: true
        });
        Gauge.prototype.measureFPS = function () {
            var currentTick = new Date().getTime();
            this._frameCount++;
            this._elapsedTime += (currentTick - this._lastTick);
            this._lastTick = currentTick;
            if (this._elapsedTime >= 1000) {
                this._fps = this._frameCount;
                this._frameCount = 0;
                this._elapsedTime -= 1000;
            }
        };
        return Gauge;
    }());
    LH.Gauge = Gauge;
})(LH || (LH = {}));
//# sourceMappingURL=Gauge.js.map