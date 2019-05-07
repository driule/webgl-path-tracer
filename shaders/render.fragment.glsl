#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 texCoord;
uniform sampler2D textureSampler;

out vec4 pixelColor;
void main() {
    pixelColor = texture(textureSampler, texCoord);
}