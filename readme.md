# WebGL Path Tracer

Demo: [`webgl-path-tracer`](https://driule.github.io/webgl-path-tracer/dist/)

Report: [`Master_Thesis_Report.pdf`](https://github.com/driule/webgl-path-tracer/blob/master/Master_Thesis_Report.pdf)

### Rendered Scenes

![Sponza](https://driule.github.io/webgl-path-tracer/dist/assets/images/scenes/gl-sponza.png)
![Pica Room](https://driule.github.io/webgl-path-tracer/dist/assets/images/scenes/gl-pica-room.png)
![Avocados](https://driule.github.io/webgl-path-tracer/dist/assets/images/scenes/gl-avocados.png)

### Progress
- [+] Next Event Estimation and Multiple Importance Sampling ported from [LightHouse2](https://github.com/jbikker/lighthouse2)
- [+] Ordered BVH traversal algorithm implemented
- [+] Multiple GL textures exploited for skydome and albedo textures loading
- [+] GLTF file loading improved: multiple meshes with different textures support; few crucial bug fixes: do not calculate GL texture size at run-time
- [+] Skydome sampling
- [+] Base color and albedo textures support
- [+] Geometry loading from GLTF files
- [+] Improved user interface: website buttons to control actions such as changing scene, stop/resume rendering
- [+] Scene camera controls via website buttons or keyboard
- [+] GLSL shaders separated into external files
- [+] Russian Roulette method to evaluate ray survival probability
- [+] BVH acceleration structure implemented. Built on JavaScript side and then passed to the fragment shader via GL texture. Traversed using stack on the shader side.
- [+] Randomize light based on seed {time, pixel coordinates, loop iteration}
- [+] Pass scene triangles and lights to the shader via texture

### Setup

- Install dependencies listed in *package.json*, and then bundle JavasScript source files
```bash
npm install

npm run develop
npm run build
```

- Translate TypeScript to JavaScript: run *Build Task* in Visual Studio Code (`CTRL + SHIFT + B`)
- Deploy `/dist` content on a web server excluding `/dist/.tmp` folder.
