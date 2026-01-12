#version 330 core

uniform samplerCube iChannel0;
uniform samplerCube iChannel1;
uniform vec2  iResolution;
uniform float iTime;

uniform float iCamYaw;
uniform float iCamPitch;
uniform float iCamRoll;
uniform float iCamOffset;
uniform float iCamL;

out vec4 fragColor;

#define PI 3.1415926538

float a = 2.0;
float M = 0.1;
float dtBase = 0.1;
int   maxSteps = 800;
float zoom = 1.5;

mat3 rotX(float aa){
    return mat3(
        1,0,0,
        0,cos(aa),-sin(aa),
        0,sin(aa), cos(aa)
    );
}
mat3 rotY(float aa){
    return mat3(
        cos(aa),0,sin(aa),
        0,1,0,
        -sin(aa),0,cos(aa)
    );
}
mat3 rotZ(float aa){
    return mat3(
        cos(aa),-sin(aa),0,
        sin(aa), cos(aa),0,
        0,0,1
    );
}

float LtOR(float l){
    float x = max(0.0, 2.0 * (abs(l) - a) / (PI * M));
    return 1.0 + M * (x * atan(x) - 0.5 * log(1.0 + x * x));
}

float LtODR(float l){
    float eps = 0.001;
    return (LtOR(l + eps) - LtOR(l - eps)) / (2.0 * eps);
}

void mainImage(out vec4 color, in vec2 fragCoord){

    vec2 uv = (2.0 * fragCoord - iResolution) / iResolution.x;
    uv.x += iCamOffset;

    vec3 vel = normalize(vec3(-zoom, uv));
    vel = rotZ(iCamRoll) * rotX(iCamPitch) * rotY(iCamYaw) * vel;

    vec2 beta = normalize(vel.yz);

    float timeDrift = 0.05 * sin(iTime * 0.3);
    float l   = iCamL + timeDrift;
    float r   = LtOR(l);
    float dl  = vel.x;
    float H   = r * length(vel.yz);
    float phi = 0.0;
    float dr;

    int steps = 0;

    while(abs(l) < max(abs(iCamL) * 2.0, a + 2.0) && steps < maxSteps){
        r  = LtOR(l);
        dr = LtODR(l);

        float dt = dtBase * clamp(r, 0.2, 1.0);

        dl  += H * H * dr / (r * r * r) * dt;
        l   += dl * dt;
        phi += H / (r * r) * dt;

        steps++;
    }

    float dx = dl * dr * cos(phi) - H / r * sin(phi);
    float dy = dl * dr * sin(phi) + H / r * cos(phi);

    vec3 cubeVec = normalize(vec3(dx, beta.x, beta.y));

    if (l > 0.0)
        color = texture(iChannel0, cubeVec);
    else
        color = texture(iChannel1, cubeVec);

    // ---- COMPILER-PROOF KEEPALIVE FOR iTime ----
    // Must *directly* affect color in a non-zero way. Tiny enough to be invisible.
    color.rgb += vec3(1e-6) * sin(iTime);
}

void main(){
    mainImage(fragColor, gl_FragCoord.xy);
}
