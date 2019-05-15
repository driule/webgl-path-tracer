var LH;
(function (LH) {
    var Shader = /** @class */ (function () {
        function Shader(name, vertexSource, fragmentSource) {
            this._attributes = {};
            this._uniforms = {};
            this._name = name;
            var vertexShader = this.loadShader(vertexSource, LH.gl.VERTEX_SHADER);
            var fragmentShader = this.loadShader(fragmentSource, LH.gl.FRAGMENT_SHADER);
            this.createProgram(vertexShader, fragmentShader);
            this.detectAttributes();
            this.detectUniforms();
        }
        Object.defineProperty(Shader.prototype, "name", {
            get: function () {
                return this._name;
            },
            enumerable: true,
            configurable: true
        });
        Shader.prototype.getAttributeLocation = function (name) {
            if (this._attributes[name] === undefined) {
                throw new Error("Unable to find attribute '" + name + "' in shader '" + this._name + "'");
            }
            return this._attributes[name];
        };
        Shader.prototype.getUniformLocation = function (name) {
            if (this._uniforms[name] === undefined) {
                throw new Error("Unable to find uniform '" + name + "' in shader '" + this._name + "'");
            }
            return this._uniforms[name];
        };
        // TODO: this is very badly harcoded way to set uniforms
        Shader.prototype.setUniforms = function (uniforms) {
            for (var name_1 in uniforms) {
                // specific case for triangle data texture
                if (name_1.toString() === "triangles") {
                    var triangleList = new Float32Array(uniforms.triangleDataTextureSize * uniforms.triangleDataTextureSize * 3);
                    for (var i = 0; i < uniforms.totalTriangles; i++) {
                        triangleList[i * 3 * 3 + 0] = uniforms.triangles[i].a[0];
                        triangleList[i * 3 * 3 + 1] = uniforms.triangles[i].a[1];
                        triangleList[i * 3 * 3 + 2] = uniforms.triangles[i].a[2];
                        triangleList[i * 3 * 3 + 3] = uniforms.triangles[i].b[0];
                        triangleList[i * 3 * 3 + 4] = uniforms.triangles[i].b[1];
                        triangleList[i * 3 * 3 + 5] = uniforms.triangles[i].b[2];
                        triangleList[i * 3 * 3 + 6] = uniforms.triangles[i].c[0];
                        triangleList[i * 3 * 3 + 7] = uniforms.triangles[i].c[1];
                        triangleList[i * 3 * 3 + 8] = uniforms.triangles[i].c[2];
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE1);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.triangleDataTextureSize, uniforms.triangleDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, triangleList);
                    var triangleDataLocation = LH.gl.getUniformLocation(this._program, "triangleDataTexture");
                    LH.gl.uniform1i(triangleDataLocation, 1);
                    continue;
                }
                // specific case for light
                if (name_1.toString() === "lights") {
                    var lightList = new Float32Array(uniforms.lightDataTextureSize * uniforms.lightDataTextureSize * 3);
                    for (var i = 0; i < uniforms.totalLights; i++) {
                        lightList[i * 3 * 2 + 0] = uniforms.lights[i].position[0];
                        lightList[i * 3 * 2 + 1] = uniforms.lights[i].position[1];
                        lightList[i * 3 * 2 + 2] = uniforms.lights[i].position[2];
                        lightList[i * 3 * 2 + 3] = uniforms.lights[i].radius;
                        lightList[i * 3 * 2 + 4] = uniforms.lights[i].intensity;
                        lightList[i * 3 * 2 + 5] = 0.0;
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE2);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.lightDataTextureSize, uniforms.lightDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, lightList);
                    var lightDataLocation = LH.gl.getUniformLocation(this._program, "lightDataTexture");
                    LH.gl.uniform1i(lightDataLocation, 2);
                    continue;
                }
                // specific case for BVH
                if (name_1.toString() == "bvhNodeList") {
                    var bvhNodeDataList = new Float32Array(uniforms.bvhDataTextureSize * uniforms.bvhDataTextureSize * 3);
                    for (var i = 0; i < uniforms.totalBvhNodes; i++) {
                        bvhNodeDataList[i * 3 * 4 + 0] = uniforms.bvhNodeList[i].min[0];
                        bvhNodeDataList[i * 3 * 4 + 1] = uniforms.bvhNodeList[i].min[1];
                        bvhNodeDataList[i * 3 * 4 + 2] = uniforms.bvhNodeList[i].min[2];
                        bvhNodeDataList[i * 3 * 4 + 3] = uniforms.bvhNodeList[i].max[0];
                        bvhNodeDataList[i * 3 * 4 + 4] = uniforms.bvhNodeList[i].max[1];
                        bvhNodeDataList[i * 3 * 4 + 5] = uniforms.bvhNodeList[i].max[2];
                        bvhNodeDataList[i * 3 * 4 + 6] = uniforms.bvhNodeList[i].isLeaf;
                        bvhNodeDataList[i * 3 * 4 + 7] = uniforms.bvhNodeList[i].first;
                        bvhNodeDataList[i * 3 * 4 + 8] = uniforms.bvhNodeList[i].count;
                        if (!uniforms.bvhNodeList[i].isLeaf) {
                            bvhNodeDataList[i * 3 * 4 + 9] = uniforms.bvhNodeList[i].left.id;
                            bvhNodeDataList[i * 3 * 4 + 10] = uniforms.bvhNodeList[i].right.id;
                        }
                        else {
                            bvhNodeDataList[i * 3 * 4 + 9] = 0.0;
                            bvhNodeDataList[i * 3 * 4 + 10] = 0.0;
                        }
                        bvhNodeDataList[i * 3 * 4 + 11] = uniforms.bvhNodeList[i].id;
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE3);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.bvhDataTextureSize, uniforms.bvhDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, bvhNodeDataList);
                    var bvhDataLocation = LH.gl.getUniformLocation(this._program, "bvhDataTexture");
                    LH.gl.uniform1i(bvhDataLocation, 3);
                    continue;
                }
                // specific case for triangle indices
                if (name_1.toString() == "triangleIndices") {
                    var triangleIndices = new Float32Array(uniforms.triangleIndicesDataTextureSize * uniforms.triangleIndicesDataTextureSize * 3);
                    for (var i = 0; i < uniforms.triangleIndices.length; i++) {
                        triangleIndices[i * 3 + 0] = uniforms.triangleIndices[i];
                        triangleIndices[i * 3 + 1] = uniforms.triangleIndices[i];
                        triangleIndices[i * 3 + 2] = uniforms.triangleIndices[i];
                    }
                    LH.gl.activeTexture(LH.gl.TEXTURE4);
                    LH.gl.bindTexture(LH.gl.TEXTURE_2D, LH.gl.createTexture());
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MIN_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameteri(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_MAG_FILTER, LH.gl.NEAREST);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_S, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texParameterf(LH.gl.TEXTURE_2D, LH.gl.TEXTURE_WRAP_T, LH.gl.CLAMP_TO_EDGE);
                    LH.gl.texImage2D(LH.gl.TEXTURE_2D, 0, LH.gl.RGB32F, uniforms.triangleIndicesDataTextureSize, uniforms.triangleIndicesDataTextureSize, 0, LH.gl.RGB, LH.gl.FLOAT, triangleIndices);
                    var triangleIndicesDataLocation = LH.gl.getUniformLocation(this._program, "triangleIndicesDataTexture");
                    LH.gl.uniform1i(triangleIndicesDataLocation, 4);
                    continue;
                }
                var location_1 = LH.gl.getUniformLocation(this._program, name_1);
                if (location_1 == null)
                    continue;
                var vector3Uniforms = [
                    "eye",
                    "ray00",
                    "ray01",
                    "ray11",
                    "ray10",
                    "light"
                ];
                var vector2Uniforms = [
                    "resolution"
                ];
                var intUniforms = [
                    "totalTriangles",
                    "totalBvhNodes",
                    "totalLights"
                ];
                var floatUniforms = [
                    "timeSinceStart",
                    "textureWeight",
                    "triangleDataTextureSize",
                    "bvhDataTextureSize",
                    "triangleIndicesDataTextureSize",
                    "lightDataTextureSize"
                ];
                var value = uniforms[name_1];
                if (vector2Uniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform2fv(location_1, new Float32Array([value[0], value[1]]));
                }
                else if (vector3Uniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform3fv(location_1, new Float32Array([value[0], value[1], value[2]]));
                }
                else if (intUniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform1i(location_1, value);
                }
                else if (floatUniforms.indexOf(name_1) > -1) {
                    LH.gl.uniform1f(location_1, value);
                }
            }
        };
        Shader.prototype.use = function () {
            LH.gl.useProgram(this._program);
        };
        Shader.prototype.delete = function () {
            LH.gl.deleteProgram(this._program);
        };
        Shader.prototype.loadShader = function (source, shaderType) {
            var shader = LH.gl.createShader(shaderType);
            LH.gl.shaderSource(shader, source);
            LH.gl.compileShader(shader);
            var shaderInfoLog = LH.gl.getShaderInfoLog(shader);
            if (shaderInfoLog !== "") {
                throw new Error("Error compiling shader '" + this._name + "': '" + shaderInfoLog + "'");
            }
            return shader;
        };
        Shader.prototype.createProgram = function (vertexShader, fragmentShader) {
            this._program = LH.gl.createProgram();
            LH.gl.attachShader(this._program, vertexShader);
            LH.gl.attachShader(this._program, fragmentShader);
            LH.gl.linkProgram(this._program);
            var programInfoLog = LH.gl.getProgramInfoLog(this._program);
            if (programInfoLog !== "") {
                throw new Error("Error linking shader '" + this._name + "': " + programInfoLog + "'");
            }
        };
        Shader.prototype.detectAttributes = function () {
            var attributeCount = LH.gl.getProgramParameter(this._program, LH.gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < attributeCount; i++) {
                var attribute = LH.gl.getActiveAttrib(this._program, i);
                if (!attribute) {
                    break;
                }
                this._attributes[attribute.name] = LH.gl.getAttribLocation(this._program, attribute.name);
            }
        };
        Shader.prototype.detectUniforms = function () {
            var uniformCount = LH.gl.getProgramParameter(this._program, LH.gl.ACTIVE_UNIFORMS);
            for (var i = 0; i < uniformCount; i++) {
                var uniform = LH.gl.getActiveUniform(this._program, i);
                if (!uniform) {
                    break;
                }
                this._uniforms[uniform.name] = LH.gl.getUniformLocation(this._program, uniform.name);
            }
        };
        return Shader;
    }());
    LH.Shader = Shader;
})(LH || (LH = {}));
//# sourceMappingURL=Shader.js.map