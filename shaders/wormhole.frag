#version 330 core

uniform samplerCube iChannel0;
uniform samplerCube iChannel1;
uniform vec2  iResolution;
uniform float iTime;

uniform int skyMode;

uniform float iCamYaw;
uniform float iCamPitch;
uniform float iCamRoll;
uniform float iCamOffset;
uniform float iCamL;

out vec4 fragColor;

#define PI 3.1415926538

float hash(vec3 p)
{
    return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453);
}

vec3 proceduralStars(vec3 dir)
{
    vec3 col = vec3(0.0);

    // faint deep-space background
    col += vec3(0.01,0.01,0.02);

    // sparse stars
    float h = hash(floor(dir * 200.0));
    float star = pow(max(0.0, h - 0.995) * 200.0, 6.0);

    col += vec3(star);

    // faint galaxy band
    float galaxy = exp(-20.0 * dir.y * dir.y);
    col += vec3(0.08,0.08,0.12) * galaxy;

    return col;
}




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






    vec3 skyColor;

    if (skyMode == 0) {
        // Original cubemap behaviour
        if (l > 0.0)
            skyColor = texture(iChannel0, cubeVec).rgb;
        else
            skyColor = texture(iChannel1, cubeVec).rgb;
    }
    else if (skyMode == 1) {
        skyColor = proceduralStars(cubeVec);
    }
    else {
        // Placeholder for equirectangular sky later
        skyColor = vec3(0.3, 0.3, 1.0);
    }
    // Photon ring brightness boost based on ray path length
    float lensBoost = 1.0 + float(steps) * 0.004;
    skyColor *= lensBoost;


    color = vec4(skyColor, 1.0);







    // ---- COMPILER-PROOF KEEPALIVE FOR iTime ----
    // Must *directly* affect color in a non-zero way. Tiny enough to be invisible.
    color.rgb += vec3(1e-6) * sin(iTime);
}

void main(){
    mainImage(fragColor, gl_FragCoord.xy);
}
