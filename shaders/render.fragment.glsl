#version 300 es

precision highp float;

in vec2 texCoord;
uniform sampler2D textureSampler;

out vec4 pixelColor;
void main() {
    pixelColor = texture(textureSampler, texCoord);
}