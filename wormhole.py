import glfw
import moderngl
import numpy as np
import time
import os
from PIL import Image

# ============================================================
# GLFW INIT
# ============================================================

if not glfw.init():
    raise RuntimeError("GLFW init failed")

glfw.window_hint(glfw.CONTEXT_VERSION_MAJOR, 3)
glfw.window_hint(glfw.CONTEXT_VERSION_MINOR, 3)
glfw.window_hint(glfw.OPENGL_PROFILE, glfw.OPENGL_CORE_PROFILE)
glfw.window_hint(glfw.RESIZABLE, glfw.TRUE)

WIDTH, HEIGHT = 900, 600

window = glfw.create_window(WIDTH, HEIGHT, "Wormhole", None, None)
if not window:
    glfw.terminate()
    raise RuntimeError("Window creation failed")

glfw.make_context_current(window)
glfw.swap_interval(1)
glfw.set_input_mode(window, glfw.CURSOR, glfw.CURSOR_DISABLED)

# ============================================================
# CAMERA STATE
# ============================================================

cam_yaw = 0.0
cam_pitch = 0.0
cam_roll = 0.0
cam_offset = 0.0
cam_l = 5.0

last_x, last_y = WIDTH / 2, HEIGHT / 2
first_mouse = True

def mouse_cb(win, x, y):
    global cam_yaw, cam_pitch, last_x, last_y, first_mouse

    if first_mouse:
        last_x, last_y = x, y
        first_mouse = False

    dx = x - last_x
    dy = y - last_y
    last_x, last_y = x, y

    cam_yaw   += dx * 0.003
    cam_pitch -= dy * 0.003
    cam_pitch = max(-1.5, min(1.5, cam_pitch))

def key_cb(win, key, sc, action, mods):
    global cam_l, cam_offset, cam_roll

    if action in (glfw.PRESS, glfw.REPEAT):
        if key == glfw.KEY_W:
            cam_l -= 0.1
        if key == glfw.KEY_S:
            cam_l += 0.1
        if key == glfw.KEY_A:
            cam_offset -= 0.05
        if key == glfw.KEY_D:
            cam_offset += 0.05
        if key == glfw.KEY_Q:
            cam_roll -= 0.05
        if key == glfw.KEY_E:
            cam_roll += 0.05
        if key == glfw.KEY_R:
            cam_l = 5.0
            cam_offset = 0.0
            cam_yaw = cam_pitch = cam_roll = 0.0
        if key == glfw.KEY_ESCAPE:
            glfw.set_window_should_close(win, True)

glfw.set_cursor_pos_callback(window, mouse_cb)
glfw.set_key_callback(window, key_cb)

# ============================================================
# MODERNGL CONTEXT
# ============================================================

ctx = moderngl.create_context()

# Fullscreen quad
quad_vbo = ctx.buffer(np.array([
    -1, -1,  1, -1,  1,  1,
    -1, -1,  1,  1, -1,  1
], dtype='f4'))

with open("wormhole.frag", "r", encoding="utf-8") as f:
    frag_src = f.read()

prog = ctx.program(
    vertex_shader="""
        #version 330
        in vec2 in_pos;
        void main() {
            gl_Position = vec4(in_pos, 0.0, 1.0);
        }
    """,
    fragment_shader=frag_src,
)

vao = ctx.simple_vertex_array(prog, quad_vbo, "in_pos")

# ============================================================
# CUBEMAP LOADING (COMPATIBLE WITH YOUR MODERNGL)
# ============================================================

def load_cubemap(folder):
    faces = ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]
    images = []

    for f in faces:
        img = Image.open(os.path.join(folder, f)).convert("RGB")
        images.append(img)

    size = images[0].size[0]
    tex = ctx.texture_cube((size, size), 3)

    for face_index, img in enumerate(images):
        tex.write(face_index, img.tobytes())

    return tex

cubeA = load_cubemap("UniverseA")
cubeB = load_cubemap("UniverseB")

cubeA.use(location=0)
cubeB.use(location=1)

prog["iChannel0"].value = 0
prog["iChannel1"].value = 1

# ============================================================
# MAIN LOOP
# ============================================================

start = time.time()

while not glfw.window_should_close(window):
    glfw.poll_events()

    t = time.time() - start
    w, h = glfw.get_framebuffer_size(window)

    # 🔥 THIS FIXES RESIZING / FULLSCREEN BLACK BORDERS
    ctx.viewport = (0, 0, w, h)

    prog["iResolution"].value = (w, h)
    prog["iTime"].value = t
    prog["iCamYaw"].value = cam_yaw
    prog["iCamPitch"].value = cam_pitch
    prog["iCamRoll"].value = cam_roll
    prog["iCamOffset"].value = cam_offset
    prog["iCamL"].value = cam_l

    ctx.clear(0.0, 0.0, 0.0)
    vao.render()

    glfw.swap_buffers(window)

glfw.terminate()
