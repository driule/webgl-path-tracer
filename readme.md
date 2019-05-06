# WebGL Path Tracer

### Progress
- [+] BVH implemented! Built on JavaScript and then passed to the fragment shader via texture. Traversed using stack,no optimizations
- [+] Randomize light based on {time, pixel coordinates, loop iteration} seed
- [+] Initiated *npm* project, all dependencies and typings controlled via *npm* package manager
- [+] Pass triangles and lights to the scene via texture

### ToDo
- [-] Generalize uniforms passing to the shader (avoid hardcoding by name); initialize dataTexture uniform type or smth.
- [-] Initialize materials
- [-] Texturing
- [-] Skydome