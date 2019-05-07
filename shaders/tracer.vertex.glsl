#version 300 es

precision highp float;

in vec3 vertex;
out vec3 initialRay;
uniform vec3 eye, ray00, ray01, ray10, ray11;

void main() {
    vec2 percent = vertex.xy * 0.5 + 0.5;
    initialRay = mix(mix(ray00, ray01, percent.y), mix(ray10, ray11, percent.y), percent.x);
    gl_Position = vec4(vertex, 1.0);
}