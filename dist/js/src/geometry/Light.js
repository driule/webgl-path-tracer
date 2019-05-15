var LH;
(function (LH) {
    var Light = /** @class */ (function () {
        function Light(position, radius, intensity) {
            this._position = position;
            this._radius = radius;
            this._intensity = intensity;
        }
        Object.defineProperty(Light.prototype, "position", {
            get: function () {
                return this._position;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "intensity", {
            get: function () {
                return this._intensity;
            },
            enumerable: true,
            configurable: true
        });
        return Light;
    }());
    LH.Light = Light;
})(LH || (LH = {}));
//# sourceMappingURL=Light.js.map