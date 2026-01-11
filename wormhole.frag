#version 330 core
precision highp float;

uniform vec2 iResolution;

out vec4 fragColor;

#define PI 3.1415926538

float a = 2.;
float M = .1;
float dtBase = .1;
int   maxSteps = 1000;

float caM = 5.;
float zoom = 1.5;

float LtOR(float l){
    float x = max(0., 2. * (abs(l) - a) / (PI * M));
    return 1. + M * (x * atan(x) - .5 * log(1. + x * x));
}

float LtODR(float l){
    float eps = 0.001;
    return (LtOR(l + eps) - LtOR(l - eps)) / (2.0 * eps);
}

void mainImage(out vec4 color, in vec2 fragCoord){

    vec2 uv  = (2. * fragCoord - iResolution) / iResolution.x;
    vec3 vel = normalize(vec3(-zoom, uv));
    vec2 beta = normalize(vel.yz);

    float l   = caM;
    float r   = LtOR(l);
    float dl  = vel.x;
    float H   = r * length(vel.yz);
    float phi = 0.;
    float dr;

    int steps = 0;

    while(abs(l) < max(abs(caM)*2., a+2.) && steps < maxSteps){

        r  = LtOR(l);
        dr = LtODR(l);

        float dt = dtBase * clamp(r, 0.2, 1.0);

        dl  += H * H * dr / (r*r*r) * dt;
        l   += dl * dt;
        phi += H / (r*r) * dt;

        steps++;
    }

    float dx = dl * dr * cos(phi) - H / r * sin(phi);
    float dy = dl * dr * sin(phi) + H / r * cos(phi);
    vec3 vec = normalize(vec3(dx, dy, beta));

    // Temporary colouring (no textures yet)
    color = vec4(vec * 0.5 + 0.5, 1.0);
}

void main(){
    mainImage(fragColor, gl_FragCoord.xy);
}
