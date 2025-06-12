/*
 * Soft moving mesh-like gradient inspired by the "fun shader" on Shadertoy
 * https://www.shadertoy.com/view/Ml3GD2
 */

export const softGradient = `
// Custom color uniforms
uniform vec3 uColorOne;
uniform vec3 uColorTwo;
uniform vec3 uColorThree;
uniform vec3 uColorFour;
uniform vec3 uColorFive;
// NEW – global motion & palette controls
uniform float uSpeed;          // replaces hard-coded 1.3
uniform float uMotionOffset;   // replaces hard-coded 0.5
uniform float uBandCount;      // replaces 4.0 in colour-band math
uniform float uCycleLength;    // replaces 10.0 in baseColorFor
uniform float uBlendWindow;    // replaces 2.0 (10-8)
// NEW – per-corner time multipliers & phases
uniform vec4 uTimeScale;  // e.g. vec4(0.99, 0.98, 0.97, 0.96)
uniform vec4 uSineFreq;   // e.g. vec4(0.06, 0.10, 0.12, 0.09)
uniform vec4 uPhaseShift; // e.g. vec4(1.0, 2.0, 5.0, 6.0)
// NEW – parameter controls
uniform float uSpread;  // spread/exponent controlling distance between colours (>0)
uniform float uRotation; // radians, orientation of gradient

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 baseColorFor(float time) {
    float i = mod(floor(time / uCycleLength), 2.0);
    float progress = mod(time, uCycleLength);
    
    // Use uniform colors instead of hardcoded values
    vec3 one = uColorOne;
    vec3 two = uColorTwo;

    
    if (i == 0.0) {
        if (progress > uCycleLength - uBlendWindow) {
          return mix(one, two, (progress - (uCycleLength - uBlendWindow)) / uBlendWindow);
        } else {
          return one;
        }
    }
    
    //if (i == 1.0) {
        if (progress > uCycleLength - uBlendWindow) {
          return mix(two, one, (progress - (uCycleLength - uBlendWindow)) / uBlendWindow);
        } else {
          return two;
        }
    //}
}

vec3 adjustSV(vec3 rgb, float s, float v) {
    vec3 hsv = rgb2hsv(rgb);
    hsv.y = s;
    hsv.z = v;
    return hsv2rgb(hsv);
}

vec3 colorFor(vec3 base, float uv) {
    vec3 first = base;
    
    vec3 second = adjustSV(base, .5, .9);
    vec3 third = adjustSV(base, .82, .56);
    vec3 fourth = adjustSV(base, .2, .96);

    //vec3 first = vec3(0.0 / 255.0, 209.0 / 255.0, 193.0 / 255.0);
    //vec3 second = vec3(110.0 / 255.0, 230.0 / 255.0, 217.0 / 255.0);
    //vec3 third = vec3(26.0 / 255.0, 143.0 / 255.0, 124.0 / 255.0);
    //vec3 fourth = vec3(193.0 / 255.0, 245.0 / 255.0, 240.0 / 255.0);
    // vec3 babu1 = vec3(0.0 / 255.0, 209.0 / 255.0, 193.0 / 255.0);
    
    float xSpan = ((uv + 1.0) / 2.0) * uBandCount;
    
    if (xSpan <= 1.0) {
        return mix(first, second, mod(xSpan, 1.0));
    }
    
    if (xSpan > 1.0 && xSpan <= 2.0) {
        return mix(second, third, mod(xSpan, 1.0));
    }

    if (xSpan > 2.0 && xSpan <= 3.0) {
        return mix(third, fourth, mod(xSpan, 1.0));
    }

    //if (x4 > 3.0 && x4 <= 4.0) {
        return mix(fourth, first, mod(xSpan, 1.0));
    //}
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float speed = uSpeed;
    float offset = uMotionOffset;
    
    vec3 top_left = colorFor(
        baseColorFor(uTimeScale.x * iTime + sin(uSineFreq.x * iTime)),
        sin(speed * uSineFreq.x * iTime + uPhaseShift.x + offset)
    );
    vec3 top_right = colorFor(
        baseColorFor(uTimeScale.y * iTime + sin(uSineFreq.y * iTime)),
        sin(speed * uSineFreq.y * iTime + uPhaseShift.y + offset)
    );
        
    vec3 bottom_left = colorFor(
        baseColorFor(uTimeScale.z * iTime + sin(uSineFreq.z * iTime)),
        sin(speed * uSineFreq.z * iTime + uPhaseShift.z + offset)
    );
    vec3 bottom_right = colorFor(
        baseColorFor(uTimeScale.w * iTime + sin(uSineFreq.w * iTime)),
        sin(speed * uSineFreq.w * iTime + uPhaseShift.w + offset)
    );
    
    
    //vec3 top_left = mix(babu2, kazan3, 0.8 * sin(iTime));
    //vec3 top_right = mix(kazan1, babu2, 0.9 * sin(iTime));
        
    //vec3 bottom_left = mix(kazan2, babu1, 0.7 * sin(iTime));
    //vec3 bottom_right = mix(babu3, kazan2, 1.2 * sin(iTime));
    
	float ymix = fragCoord.y / iResolution.y;
    vec3 left = mix(top_left, bottom_left, ymix);
    vec3 right = mix(top_right, bottom_right, ymix);
    
    float xmix = fragCoord.x / iResolution.x;
    
    // Output blended colour
    fragColor = vec4(mix(left, right, xmix), 1.0);
}
`;

export const linearGradient = `
//
// Demonstrates high-quality and proper gamma-corrected color gradient.
//
// Does interpolation in linear color space, mixing colors using smoothstep function.
// Also adds some gradient noise to reduce banding.
//
// References:
// http://blog.johnnovak.net/2016/09/21/what-every-coder-should-know-about-gamma/
// https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch24.html
// http://loopit.dk/banding_in_games.pdf
//
// This shader is dedicated to public domain.
//

#define SRGB_TO_LINEAR(c) pow((c), vec3(2.2))
#define LINEAR_TO_SRGB(c) pow((c), vec3(1.0 / 2.2))
#define SRGB(r, g, b) SRGB_TO_LINEAR(vec3(float(r), float(g), float(b)) / 255.0)

// NEW – external colour controls (match softGradient)
uniform vec3 uColorOne;
uniform vec3 uColorTwo;
uniform vec3 uColorThree;
uniform vec3 uColorFour;
uniform vec3 uColorFive;
// NEW – animation control
uniform float uSpeed;
// Parameters for colour spread and gradient orientation
uniform float uSpread;  // >0, controls distance between colours
uniform float uRotation; // radians
uniform float uNoiseAmp; // amplitude of dithering noise

// Gradient noise from Jorge Jimenez's presentation:
// http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
float gradientNoise(in vec2 uv)
{
    const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
}

// Colours now supplied by the host application (sRGB 0-1 range).
// Convert them to linear space before any interpolation.
vec3 color0_linear(in vec3 c) { return SRGB_TO_LINEAR(c); }
vec3 color1_linear(in vec3 c) { return SRGB_TO_LINEAR(c); }

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 a; // First gradient point.
    vec2 b; // Second gradient point.
    if (iMouse == vec4(0.0)) {
        a = 0.1 * iResolution.xy;
        b = iResolution.xy;
    } else {
        a = abs(iMouse.zw);
        b = iMouse.xy;
    }

    // Compute unit direction vector from rotation angle
    vec2 dir = normalize(vec2(cos(uRotation), sin(uRotation)));

    // Project the fragment coordinate onto the direction vector, normalised by screen size
    float projection = dot(fragCoord.xy, dir) / max(iResolution.x, iResolution.y);

    // Sliding offset to animate movement
    float offset = fract(iTime * uSpeed / 10.0);

    // Repeat every uSpread screen units to create continuous gradient
    float cycle = fract((projection / uSpread) + offset);

    // Triangle wave produces mirrored blend (edges=1, centre=0)
    float tri = abs(cycle * 2.0 - 1.0);

    // Fetch colours in linear space and interpolate so both ends are uColorTwo.
    vec3 COLOR_START_END = color1_linear(uColorTwo); // duplicated at both ends
    vec3 COLOR_MID = color0_linear(uColorOne);
    vec3 color = mix(COLOR_MID, COLOR_START_END, tri);

    // Convert the blended color back to sRGB for correct display.
    color = LINEAR_TO_SRGB(color);

    // Add gradient noise (dithering) to reduce banding.
    float noise = (gradientNoise(fragCoord) - 0.5) * uNoiseAmp;
    color += noise;

    fragColor = vec4(color, 1.0);
}

`;

export const blobGradient = `
#define S(a,b,t) smoothstep(a,b,t)

// Shared colour uniforms (match softGradient)
uniform vec3 uColorOne;
uniform vec3 uColorTwo;
uniform vec3 uColorThree;
uniform vec3 uColorFour;
uniform vec3 uColorFive;
// Animation speed (seconds multiplier)
uniform float uSpeed;

mat2 Rot(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}


// Created by inigo quilez - iq/2014
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
vec2 hash( vec2 p )
{
    p = vec2( dot(p,vec2(2127.1,81.17)), dot(p,vec2(1269.5,283.37)) );
	return fract(sin(p)*43758.5453);
}

float noise( in vec2 p )
{
    vec2 i = floor( p );
    vec2 f = fract( p );
	
	vec2 u = f*f*(3.0-2.0*f);

    float n = mix( mix( dot( -1.0+2.0*hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                        dot( -1.0+2.0*hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                   mix( dot( -1.0+2.0*hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                        dot( -1.0+2.0*hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
	return 0.5 + 0.5*n;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    float ratio = iResolution.x / iResolution.y;

    vec2 tuv = uv;
    tuv -= .5;

    // rotate with Noise
    float degree = noise(vec2(iTime*.1, tuv.x*tuv.y));

    tuv.y *= 1./ratio;
    tuv *= Rot(radians((degree-.5)*720.+180.));
	tuv.y *= ratio;

    // Wave warp with sin
    float frequency = 5.;
    float amplitude = 30.;
    float speed = iTime * uSpeed;
    tuv.x += sin(tuv.y*frequency+speed)/amplitude;
   	tuv.y += sin(tuv.x*frequency*1.5+speed)/(amplitude*.5);
    
    
    // draw the image
    vec3 colorYellow = uColorOne;
    vec3 colorDeepBlue = uColorTwo;
    vec3 layer1 = mix(colorYellow, colorDeepBlue, S(-.3, .2, (tuv*Rot(radians(-5.))).x));
    
    vec3 colorRed = uColorThree;
    vec3 colorBlue = uColorFour;
    vec3 layer2 = mix(colorRed, colorBlue, S(-.3, .2, (tuv*Rot(radians(-5.))).x));
    
    vec3 finalComp = mix(layer1, layer2, S(.5, -.3, tuv.y));
    
    vec3 col = finalComp;
    
    fragColor = vec4(col,1.0);
}
`;
export const parallaxStars = `
/**
	Parallax Stars
	shader by @hugoaboud
	
	License: GPL-3.0
**/

/**
	Properties
**/

// Background Gradient
vec4 _TopColor = vec4(0.24,0.27,0.41,1);
vec4 _BottomColor = vec4(0.07,0.11,0.21,1);

// Star colors
vec4 _Star1Color = vec4(1,0.94,0.72,0.7);
vec4 _Star2Color = vec4(0.18,0.03,0.41,0.7);
vec4 _Star3Color = vec4(0.63,0.50,0.81,0.7);

// Star grid
float _Grid = 40.0;
float _Size = 0.15;

// Parallax Speed
vec2 _Speed = vec2(0, 3);

/**
	Utilities
**/

// Generates a random 2D vector from another 2D vector
// seed must be a large number
// output range: ([0..1[,[0..1[)
vec2 randVector(in vec2 vec, in float seed)
{
    return vec2(fract(sin(vec.x*999.9+vec.y)*seed),fract(sin(vec.y*999.9+vec.x)*seed));
}

/**
	Star shader
**/

// Draw star grid
void drawStars(inout vec4 fragColor, in vec4 color, in vec2 uv, in float grid, in float size, in vec2 speed, in float seed)
{
    uv += iTime * speed;
    
    // Split UV into local grid
    vec2 local = mod(uv,grid)/grid;
    
    // Random vector for each grid cell
    vec2 randv = randVector(floor(uv/grid), seed)-0.5;
    float len = length(randv);
    
    // If center + random vector lies inside cell
    // Draw circle
    if (len < 0.5) {
        // Draw circle on local grid
        float radius = 1.0-distance(local, vec2(0.5,0.5)+randv)/(size*(0.5-len));
        if (radius > 0.0) fragColor += color*radius;
    }
}

/**
	Main frag shader
**/

void mainImage(out vec4 fragColor, in vec2 fragCoord )
{    
    // Stars
    drawStars(fragColor, _Star1Color, fragCoord, _Grid, _Size, _Speed, 123456.789);
   	drawStars(fragColor, _Star2Color, fragCoord, _Grid*2.0/3.0, _Size, _Speed/1.2, 345678.912);
    drawStars(fragColor, _Star3Color, fragCoord, _Grid/2.0, _Size*3.0/4.0, _Speed/1.6, 567891.234);
}
    `;

export const auroraWave = `
    // Based on code by Ian McEwan, Ashima Arts.

// Shared colour uniforms (match softGradient)
uniform vec3 uColorOne;
uniform vec3 uColorTwo;
uniform vec3 uColorThree;
uniform vec3 uColorFour;
uniform vec3 uColorFive;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  
  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 45.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord.xy / iResolution.xy;
    uv.y *= iResolution.y / iResolution.x;

    // Time
    float time = iTime * 0.5;

    // Calculate noise for movement and shape
    float noise = snoise(vec3(uv * 3.0, time));

    // Aurora intensity
    float auroraIntensity = pow(uv.y, 2.0) * 3.0 * (0.5 + 0.5 * noise);

    // Add some wind based on time
    float wind = snoise(vec3(time * 0.1, uv.y * 2.0, time));

    // Adjust UV based on noise and wind for wave shapes
    uv.x += wind * 0.1;
    uv.y += noise * 0.1;

    // Color gradient controlled by shared uniforms
    vec3 auroraColor = mix(uColorOne, uColorTwo, uv.y * 1.5 + noise * 1.0);

    // Apply intensity to color
    auroraColor *= auroraIntensity;

    // Output color
    fragColor = vec4(auroraColor, 1.0);
}

`;
