#version 300 es

@import ./common/precisions;

in vec2 texCoord;
uniform sampler2D textureSampler;

out vec4 pixelColor;
void main() {
    pixelColor = texture(textureSampler, texCoord);
}