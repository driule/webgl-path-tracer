# WebGL Path Tracer

Demo: [students.science.uu.nl/~6070981](http://www.students.science.uu.nl/~6070981)

### Progress
- [+] Multiple GL textures exploited for skydome and albedo textures loading
- [+] Proper camera controls implemented
- [+] GLTF file loading improved: multiple meshes with different textures support; few crucial bug fixes: do not calculate texture size at run-time
- [+] Skydome sampling
- [+] Base color textures implemented
- [+] Loading geometry from GLTF files implemented; Preparation for texturing
- [+] Improved user interface: added more controls (by clicking buttons); change scene, stop/render; etc.
- [+] Camera control buttons implemented
- [+] GLSL shaders separated into external files
- [+] Russian Roulette implemented
- [+] BVH implemented! Built on JavaScript and then passed to the fragment shader via texture. Traversed using stack, no optimizations
- [+] Randomize light based on seed {time, pixel coordinates, loop iteration}
- [+] Initiated *npm* project, all dependencies and typings controlled via *npm* package manager
- [+] Pass triangles and lights to the scene via texture

### ToDo
- [-] Port shading functionality from LightHouse

### How to run?
- Install all dependencies listed in *package.json*: **npm install**
- Compile TypeScript to JavaScript: run *Build Task* in Visual Studio Code (**CTRL + SHIFT + B**)
- Bundle JavasScript source files into one JS bundle: **npm run develop** or **npm run build**
- Deploy */dist* content on a web server excluding */dist/.tmp* folder.
