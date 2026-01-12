import glfw
import time

if not glfw.init():
    raise RuntimeError("GLFW init failed")

# Force window to be visible and focused
glfw.window_hint(glfw.VISIBLE, glfw.TRUE)
glfw.window_hint(glfw.FOCUSED, glfw.TRUE)

window = glfw.create_window(640, 480, "RAW GLFW FOCUS TEST", None, None)
if not window:
    glfw.terminate()
    raise RuntimeError("Window creation failed")

glfw.make_context_current(window)

print("Window created. CLICK ON IT. Press keys. Move mouse.")

def key_cb(window, key, scancode, action, mods):
    print("KEY:", key, action)

def mouse_cb(window, x, y):
    print("MOUSE:", int(x), int(y))

glfw.set_key_callback(window, key_cb)
glfw.set_cursor_pos_callback(window, mouse_cb)

# Explicitly request focus
glfw.focus_window(window)

while not glfw.window_should_close(window):
    glfw.poll_events()
    time.sleep(0.01)

glfw.terminate()
