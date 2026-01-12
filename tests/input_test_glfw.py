from moderngl_window.conf import settings

# 🔴 MUST be before importing moderngl_window
settings.WINDOW["backend"] = "glfw"
settings.WINDOW["size"] = (600, 400)
settings.WINDOW["title"] = "GLFW INPUT TEST"

import moderngl_window as mglw


class InputTest(mglw.WindowConfig):
    gl_version = (3, 3)

    def on_show(self):
        print("WINDOW SHOWN — GLFW backend active")

    def key_event(self, key, action, modifiers):
        print("KEY:", key, action)

    def mouse_position_event(self, x, y, dx, dy):
        print("MOUSE:", dx, dy)

    def mouse_press_event(self, x, y, button):
        print("BUTTON:", button)

    def on_render(self, time, frame_time):
        self.ctx.clear(0.25, 0.25, 0.25)


if __name__ == "__main__":
    mglw.run_window_config(InputTest)
