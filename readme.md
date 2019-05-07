# WebGL Path Tracer

Demo: [students.science.uu.nl/~6070981](http://www.students.science.uu.nl/~6070981)

### Progress
- [+] Camera control buttons implemented
- [+] GLSL shaders separated into external files
- [+] Russian Roulette implemented
- [+] BVH implemented! Built on JavaScript and then passed to the fragment shader via texture. Traversed using stack, no optimizations
- [+] Randomize light based on seed {time, pixel coordinates, loop iteration}
- [+] Initiated *npm* project, all dependencies and typings controlled via *npm* package manager
- [+] Pass triangles and lights to the scene via texture

### ToDo
- [-] Improve user interface: add more controls (by clicking buttons); change scene, stop/render; etc.
- [-] Generalize uniforms passing to the shader (avoid hardcoding by name); initialize dataTexture uniform type or smth.
- [-] Initialize materials
- [-] Texturing
- [-] Skydome
