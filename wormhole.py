import moderngl
import moderngl_window as mglw
from moderngl_window.conf import settings

# Window configuration
settings.WINDOW['size'] = (900, 600)
settings.WINDOW['title'] = "Local Wormhole Renderer"

class WormholeApp(mglw.WindowConfig):
    gl_version = (3, 3)
    resource_dir = '.'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Load and compile the shader
        self.program = self.ctx.program(
            vertex_shader='''
                #version 330 core
                in vec2 in_position;
                void main() {
                    gl_Position = vec4(in_position, 0.0, 1.0);
                }
            ''',
            fragment_shader=open("wormhole.frag", "r", encoding="utf-8").read()
        )

        # Fullscreen quad
        self.quad = mglw.geometry.quad_2d_fs()

    def render(self, time, frame_time):
        self.ctx.clear()
        self.program['iResolution'].value = self.wnd.size
        self.quad.render(self.program)

if __name__ == "__main__":
    mglw.run_window_config(WormholeApp)
