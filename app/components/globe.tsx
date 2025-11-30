"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Shader for animated pixelated space background
const spaceVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const spaceFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

#define PI 3.14159265359
#define LAYER_COUNT 4

// Uniforms as constants
const vec3 backgroundColor = vec3(0.005, 0.01, 0.015);
const float density = 0.8;
const vec2 starSpeed = vec2(0.0001, 0.0001);
const vec2 starWave = vec2(0.1, 0.05);
const float starSize = 2.0;
const float starRotateSpeed = 0.1;
const float twinkleEffect = 0.5;
const float twinkleSpeed = 0.1;
const float pixelateCount = 1920.0;
const float starBrightness = 0.1; // Global star brightness multiplier
const float starOpacity = 0.33; // Final opacity blend (0.0 - 1.0) - caps maximum star intensity
const float starMaxIntensity = 0.5; // Clamp max star brightness for accessibility

float one_div_x(float x) {
    return (abs(x) < 0.0001) ? 1.0 : (1.0 / x);
}

float one_div_x2(float x) {
    return one_div_x(x) * one_div_x(x);
}

float get_beta_w(float x, float f, float size) {
    return size * x * PI / f;
}

float get_beta_h(float y, float f, float size) {
    return size * y * PI / f;
}

// Diffraction pattern for star shape
float get_i(vec2 uv, float f, vec2 SIZE) {
    return one_div_x2(get_beta_w(uv.x, f, SIZE.x)) * one_div_x2(get_beta_h(uv.y, f, SIZE.y));
}

// Random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Hash for noise
float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

// Smooth value noise (for cloud shapes)
float valueNoise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);

    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);

    // Four corners
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    // Bilinear interpolation
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM (Fractal Brownian Motion) for organic cloud shapes
float fbm(vec2 uv, float time) {
    float n = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
        vec2 offset = vec2(
            sin(time * 0.015 + float(i) * 0.7) * 0.2,
            cos(time * 0.012 + float(i) * 1.1) * 0.15
        );
        n += amplitude * valueNoise(uv * frequency + offset);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return n;
}

// Pixelate a value - renders smooth shapes with chunky pixels
float pixelateValue(float value, float levels) {
    return floor(value * levels) / levels;
}

vec2 get_star_world_center(vec2 grid_id, vec2 time_offset, vec2 star_offset, float layer_scale) {
    return (grid_id + star_offset + time_offset) / layer_scale;
}

vec2 rotate(vec2 uv, float add_theta) {
    float theta = atan(uv.y, uv.x) + add_theta;
    float r = length(uv);
    return vec2(r * cos(theta), r * sin(theta));
}

void main() {
    vec3 color = backgroundColor;

    float aspect_ratio = uResolution.x / uResolution.y;

    // Pixelate UV
    vec2 st = vUv;
    st = round(st * pixelateCount) / pixelateCount;
    st.x *= aspect_ratio;

    vec2 cuv = (st - 0.5) * 2.0;

    // === OORT CLOUDS - Organic shapes with pixelated rendering ===
    float cloudPixelScale = 100.0; // Pixel grid for chunky rendering
    vec2 cloudSt = vUv;
    cloudSt = floor(cloudSt * cloudPixelScale * vec2(aspect_ratio, 1.0)) / (cloudPixelScale * vec2(aspect_ratio, 1.0));

    // Cloud layer 1 - Large wispy nebula
    float cloud1 = fbm(cloudSt * 2.5 + vec2(0.0, 0.0), uTime);
    cloud1 = smoothstep(0.35, 0.6, cloud1); // Soft threshold for wispy edges
    cloud1 = pixelateValue(cloud1, 8.0); // Quantize intensity for pixelated look
    vec3 cloud1Color = vec3(0.02, 0.06, 0.08); // Deep teal
    color += cloud1Color * cloud1 * 0.5;

    // Cloud layer 2 - Mid-distance clouds
    float cloud2 = fbm(cloudSt * 3.0 + vec2(5.2, 3.1), uTime * 0.7);
    cloud2 = smoothstep(0.4, 0.65, cloud2);
    cloud2 = pixelateValue(cloud2, 6.0);
    vec3 cloud2Color = vec3(0.01, 0.04, 0.06); // Darker blue
    color += cloud2Color * cloud2 * 0.4;

    // Cloud layer 3 - Green-tinted accent nebula (hacker vibe)
    float cloud3 = fbm(cloudSt * 2.0 + vec2(8.5, 1.7), uTime * 0.5);
    cloud3 = smoothstep(0.42, 0.68, cloud3);
    cloud3 = pixelateValue(cloud3, 5.0);
    vec3 cloud3Color = vec3(0.01, 0.05, 0.03); // Dark green tint
    color += cloud3Color * cloud3 * 0.35;

    // Multi-layer star effect
    for (int layer = 0; layer < LAYER_COUNT; layer++) {
        float layer_scale = exp(float(layer + 1) * density);
        vec2 layer_speed = starSpeed * (1.0 + float(layer) * 0.3);
        float layer_size = starSize * (1.0 - float(layer) * 0.15);

        vec2 layer_st = st * layer_scale;
        vec2 cuv_st = cuv;

        vec2 time_offset = uTime * layer_speed;
        layer_st -= time_offset;

        vec2 grid_st = fract(layer_st);
        vec2 grid_id = floor(layer_st);

        float rand_seed = random(grid_id);

        // Star position with subtle wave motion
        vec2 star_pos = vec2(
            0.5 + (0.3 * sin((rand_seed * 6.28) + (uTime * starWave.x))),
            0.5 + (0.2 * cos((rand_seed * 12.56) + (uTime * starWave.y)))
        );

        float dist = distance(grid_st, star_pos);
        float snow_size = layer_size * 0.01 * (0.5 + 0.5 * rand_seed);
        float brightness = 1.0 - (float(layer) * 0.25);

        // Gaussian falloff
        float m = exp((-dist * dist) / (snow_size * snow_size));

        // Diffraction star pattern
        vec2 fst = cuv_st - (get_star_world_center(grid_id, time_offset, star_pos, layer_scale) - 0.5) * 2.0;
        fst = rotate(fst, uTime * starRotateSpeed);

        float star = m * 0.5 * (get_i(fst, 0.8 - (dist * 42.0), vec2(1.0 / snow_size)) + 1.0);

        // Twinkle effect
        float twinkle = (1.0 - twinkleEffect) + twinkleEffect * (
            sin(rand_seed * 100.0 + uTime * twinkleSpeed) *
            cos(rand_seed * 120.0 + uTime * (twinkleSpeed + 2.0))
        );
        star *= twinkle;

        // Color variation - bias toward cool colors with green accent
        vec3 starColor = vec3(
            random(grid_id - 3.0) * 0.4,
            random(grid_id + 7.0) * 0.6 + 0.4,
            random(grid_id + 5.0) * 0.5 + 0.5
        );

        // Some stars get the hacker green
        if (random(grid_id * 2.0) > 0.85) {
            starColor = vec3(0.2, 0.9, 0.5);
        }

        // Calculate star contribution with brightness control
        vec3 starContribution = (star * brightness * starBrightness) * starColor;

        // Clamp max intensity for accessibility (prevents harsh bright spikes)
        starContribution = min(starContribution, vec3(starMaxIntensity));

        // Apply opacity blend
        starContribution *= starOpacity;

        color = max(color + starContribution, color);
    }

    // Subtle vignette
    float vignette = 1.0 - length((vUv - 0.5) * 1.1);
    vignette = smoothstep(0.0, 0.8, vignette);
    color *= vignette * 0.7 + 0.3;

    gl_FragColor = vec4(color, 1.0);
}
`;

// Globe shader for land/ocean rendering
const globeVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const globeFragmentShader = `
uniform sampler2D uLandMask;
uniform sampler2D uCityLights;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// Colors
const vec3 oceanColor = vec3(0.02, 0.04, 0.06);
const vec3 landColor = vec3(0.03, 0.06, 0.04);
const vec3 coastlineColor = vec3(0.063, 0.725, 0.506); // #10b981
const vec3 gridColor = vec3(0.063, 0.725, 0.506);

// City light colors - BO2 style orange/yellow glow
const vec3 cityLightColor = vec3(1.0, 0.7, 0.3);
const vec3 cityLightColorAlt = vec3(0.063, 0.725, 0.506); // Green accent for some cities

// Hash for noise
float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

// Simple noise for ocean animation
float noise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// BO2-style reactive light flicker
float cityFlicker(vec2 uv, float time, float intensity) {
    // Multiple frequency flickers for realistic light variation
    float flicker1 = sin(time * 3.0 + hash(uv * 100.0) * 6.28) * 0.15;
    float flicker2 = sin(time * 7.0 + hash(uv * 200.0) * 6.28) * 0.1;
    float flicker3 = sin(time * 0.5 + hash(uv * 50.0) * 6.28) * 0.2;

    // Random on/off pattern - some lights turn off momentarily
    float onOff = step(0.03, hash(floor(uv * 500.0) + floor(time * 0.5)));

    // Combine flickers with base intensity
    float base = 0.7 + flicker1 + flicker2 + flicker3;
    return base * onOff * intensity;
}

void main() {
    // Sample land mask
    float land = texture2D(uLandMask, vUv).r;

    // Sample city lights texture (R = intensity, G = population density for brightness)
    vec4 cityData = texture2D(uCityLights, vUv);
    float cityIntensity = cityData.r;
    float populationDensity = cityData.g;

    // Detect edges for coastline glow
    float texelSize = 1.0 / 2048.0;
    float landL = texture2D(uLandMask, vUv + vec2(-texelSize, 0.0)).r;
    float landR = texture2D(uLandMask, vUv + vec2(texelSize, 0.0)).r;
    float landU = texture2D(uLandMask, vUv + vec2(0.0, texelSize)).r;
    float landD = texture2D(uLandMask, vUv + vec2(0.0, -texelSize)).r;

    float edge = abs(land - landL) + abs(land - landR) + abs(land - landU) + abs(land - landD);
    edge = smoothstep(0.0, 0.5, edge);

    // Base color
    vec3 color = mix(oceanColor, landColor, land);

    // Subtle ocean animation
    if (land < 0.5) {
        float oceanNoise = noise(vUv * 20.0 + uTime * 0.02) * 0.3 +
                          noise(vUv * 40.0 - uTime * 0.015) * 0.2;
        color += vec3(0.0, 0.02, 0.03) * oceanNoise;
    }

    // Subtle land grid pattern
    if (land > 0.5) {
        // Lat/lon grid on land
        vec2 gridUv = vUv * vec2(36.0, 18.0); // 10-degree grid
        vec2 grid = abs(fract(gridUv - 0.5) - 0.5) / fwidth(gridUv);
        float gridLine = min(grid.x, grid.y);
        float gridMask = 1.0 - smoothstep(0.0, 1.5, gridLine);
        color += gridColor * gridMask * 0.08;
    }

    // === CITY LIGHTS - BO2 Style ===
    if (cityIntensity > 0.01) {
        // Apply flicker effect based on position and time
        float flicker = cityFlicker(vUv, uTime, populationDensity);

        // Mix between orange and green based on hash for variety
        float colorMix = step(0.7, hash(floor(vUv * 200.0)));
        vec3 lightColor = mix(cityLightColor, cityLightColorAlt, colorMix);

        // Brighter core with softer glow falloff
        float lightStrength = cityIntensity * flicker * 1.5;

        // Add bloom/glow effect around bright areas
        float glow = cityIntensity * populationDensity * 0.3;

        // Apply city lights
        color += lightColor * lightStrength;
        color += lightColor * glow * 0.5;
    }

    // Coastline glow
    color += coastlineColor * edge * 0.6;

    // Rim lighting for sphere depth
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
    rim = pow(rim, 3.0);
    color += coastlineColor * rim * 0.15;

    gl_FragColor = vec4(color, 1.0);
}
`;

// Types for GeoJSON
type GeoJSONGeometry = {
    type: "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon";
    coordinates: number[][] | number[][][] | number[][][][];
};

type GeoJSONFeature = {
    type: "Feature";
    geometry: GeoJSONGeometry;
};

type GeoJSON = {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
};

// Create land mask texture from GeoJSON polygon data
function createLandMaskTexture(geojson: GeoJSON, width: number = 2048, height: number = 1024): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Fill with ocean (black)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Fill land (white)
    ctx.fillStyle = "#ffffff";

    // Convert lon/lat to canvas coordinates
    const lonLatToCanvas = (lon: number, lat: number): [number, number] => {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return [x, y];
    };

    // Draw each polygon
    geojson.features.forEach((feature) => {
        const { geometry } = feature;

        if (geometry.type === "Polygon") {
            const rings = geometry.coordinates as number[][][];
            drawPolygon(ctx, rings, lonLatToCanvas);
        } else if (geometry.type === "MultiPolygon") {
            const polygons = geometry.coordinates as number[][][][];
            polygons.forEach((rings) => {
                drawPolygon(ctx, rings, lonLatToCanvas);
            });
        }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
}

// Draw a polygon with holes
function drawPolygon(
    ctx: CanvasRenderingContext2D,
    rings: number[][][],
    lonLatToCanvas: (lon: number, lat: number) => [number, number]
) {
    if (rings.length === 0) return;

    ctx.beginPath();

    // Outer ring
    const outerRing = rings[0];
    if (outerRing.length > 0) {
        const [startX, startY] = lonLatToCanvas(outerRing[0][0], outerRing[0][1]);
        ctx.moveTo(startX, startY);

        for (let i = 1; i < outerRing.length; i++) {
            const [x, y] = lonLatToCanvas(outerRing[i][0], outerRing[i][1]);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    // Inner rings (holes) - drawn in reverse to cut out
    for (let r = 1; r < rings.length; r++) {
        const innerRing = rings[r];
        if (innerRing.length > 0) {
            const [startX, startY] = lonLatToCanvas(innerRing[0][0], innerRing[0][1]);
            ctx.moveTo(startX, startY);

            // Draw in reverse order for holes
            for (let i = innerRing.length - 1; i >= 0; i--) {
                const [x, y] = lonLatToCanvas(innerRing[i][0], innerRing[i][1]);
                ctx.lineTo(x, y);
            }
            ctx.closePath();
        }
    }

    ctx.fill("evenodd");
}

// Urban area GeoJSON feature type
type UrbanFeature = {
    type: "Feature";
    geometry: GeoJSONGeometry;
    properties: {
        name_conve?: string;
        max_pop_al?: number;
        max_pop_20?: number;
    };
};

type UrbanGeoJSON = {
    type: "FeatureCollection";
    features: UrbanFeature[];
};

// Create city lights texture from urban areas GeoJSON
// R channel = light intensity (presence of urban area)
// G channel = population density (normalized, for brightness variation)
function createCityLightsTexture(geojson: UrbanGeoJSON, width: number = 2048, height: number = 1024): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Start with black (no lights)
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    // Find max population for normalization
    let maxPop = 0;
    geojson.features.forEach((feature) => {
        const pop = feature.properties?.max_pop_al || feature.properties?.max_pop_20 || 0;
        if (pop > maxPop) maxPop = pop;
    });

    // Convert lon/lat to canvas coordinates
    const lonLatToCanvas = (lon: number, lat: number): [number, number] => {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return [x, y];
    };

    // Draw each urban area with intensity based on population
    geojson.features.forEach((feature) => {
        const { geometry, properties } = feature;

        // Skip features with null/missing geometry
        if (!geometry) return;

        const pop = properties?.max_pop_al || properties?.max_pop_20 || 1000;

        // Normalize population to 0-1 range (using log scale for better distribution)
        const normalizedPop = Math.min(1.0, Math.log10(pop + 1) / Math.log10(maxPop + 1));

        // R channel: full brightness for any urban area
        // G channel: population-based intensity for flicker strength
        const r = 255;
        const g = Math.floor(normalizedPop * 255);
        const b = 0;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        if (geometry.type === "Polygon") {
            const rings = geometry.coordinates as number[][][];
            drawCityPolygon(ctx, rings, lonLatToCanvas);
        } else if (geometry.type === "MultiPolygon") {
            const polygons = geometry.coordinates as number[][][][];
            polygons.forEach((rings) => {
                drawCityPolygon(ctx, rings, lonLatToCanvas);
            });
        }
    });

    // Apply a slight blur for glow effect
    ctx.filter = "blur(2px)";
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
}

// Draw a city polygon (simplified version without hole handling for performance)
function drawCityPolygon(
    ctx: CanvasRenderingContext2D,
    rings: number[][][],
    lonLatToCanvas: (lon: number, lat: number) => [number, number]
) {
    if (rings.length === 0) return;

    ctx.beginPath();

    // Outer ring
    const outerRing = rings[0];
    if (outerRing.length > 0) {
        const [startX, startY] = lonLatToCanvas(outerRing[0][0], outerRing[0][1]);
        ctx.moveTo(startX, startY);

        for (let i = 1; i < outerRing.length; i++) {
            const [x, y] = lonLatToCanvas(outerRing[i][0], outerRing[i][1]);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    ctx.fill();
}

export function Globe() {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const landTextureRef = useRef<THREE.CanvasTexture | null>(null);
    const cityLightsTextureRef = useRef<THREE.CanvasTexture | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new THREE.Scene();

        // Camera
        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 2.5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.pointerEvents = "none"; // Canvas doesn't capture events
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Space background shader
        const spaceUniforms = {
            uTime: { value: 0 },
            uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        };

        const spaceMaterial = new THREE.ShaderMaterial({
            vertexShader: spaceVertexShader,
            fragmentShader: spaceFragmentShader,
            uniforms: spaceUniforms,
            depthWrite: false,
        });

        const spaceGeometry = new THREE.PlaneGeometry(2, 2);
        const spaceMesh = new THREE.Mesh(spaceGeometry, spaceMaterial);
        spaceMesh.renderOrder = -1;

        // Create a separate scene for background to render it fullscreen
        const bgScene = new THREE.Scene();
        const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        bgScene.add(spaceMesh);

        // Globe geometry
        const GLOBE_RADIUS = 0.8;
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

        // Globe shader uniforms - will be updated when land data loads
        const globeUniforms = {
            uLandMask: { value: new THREE.Texture() },
            uCityLights: { value: new THREE.Texture() },
            uTime: { value: 0 },
        };

        // Temporary dark material until land data loads
        const globeMaterial = new THREE.ShaderMaterial({
            vertexShader: globeVertexShader,
            fragmentShader: globeFragmentShader,
            uniforms: globeUniforms,
        });

        // Create a parent group for axial tilt (Earth's ~23.5 degrees)
        const AXIAL_TILT = 23.5 * (Math.PI / 180);
        const globeGroup = new THREE.Group();
        globeGroup.rotation.z = AXIAL_TILT;
        // Position globe in top-left of 3D space (negative X = left, positive Y = up)
        globeGroup.position.set(-1.25, 0.25, 0);
        scene.add(globeGroup);

        const globe = new THREE.Mesh(globeGeometry, globeMaterial);
        globe.renderOrder = 0;
        globeGroup.add(globe);

        // Load land polygon data and create texture
        fetch("/assets/ne_50m_land.json")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((geojson: GeoJSON) => {
                const landTexture = createLandMaskTexture(geojson);
                landTextureRef.current = landTexture;
                globeUniforms.uLandMask.value = landTexture;
            })
            .catch((err) => console.error("Failed to load land data:", err));

        // Load urban areas data for city lights (BO2-style)
        fetch("/assets/ne_10m_urban_areas_landscan.json")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((geojson: UrbanGeoJSON) => {
                const cityLightsTexture = createCityLightsTexture(geojson);
                cityLightsTextureRef.current = cityLightsTexture;
                globeUniforms.uCityLights.value = cityLightsTexture;
            })
            .catch((err) => console.error("Failed to load urban areas data:", err));

        // Outer glow ring (tilted with globe)
        const ringGeometry = new THREE.RingGeometry(GLOBE_RADIUS + 0.005, GLOBE_RADIUS + 0.01, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x10b981,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        globeGroup.add(ring);

        // Ambient particles (in scene, not tilted)
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 16;
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = GLOBE_RADIUS + 0.15 + Math.random() * 0.25;

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }

        particlesGeometry.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3)
        );

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0x10b981,
            size: 0.012,
            transparent: true,
            opacity: 0.5,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        globeGroup.add(particles);

        // === INTERACTIVE DRAG CONTROLS ===
        // Raycaster for detecting globe interactions
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Drag state
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        let velocityX = 0;
        let velocityY = 0;
        let userRotationX = 0; // Accumulated user rotation (pitch)
        let userRotationY = 0; // Accumulated user rotation (yaw)
        let lastInteractionTime = 0;
        const FRICTION = 0.95; // Momentum decay
        const REALIGN_DELAY = 2000; // ms before starting to realign
        const REALIGN_SPEED = 0.02; // How fast to realign (0-1, lower = slower)
        const DRAG_SENSITIVITY = 0.005;

        // Check if mouse/touch is over the globe
        const isOverGlobe = (clientX: number, clientY: number): boolean => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObject(globe);
            return intersects.length > 0;
        };

        // Mouse event handlers - use document level to work with pointer-events: none
        const onMouseDown = (event: MouseEvent) => {
            if (isOverGlobe(event.clientX, event.clientY)) {
                event.preventDefault();
                event.stopPropagation();
                isDragging = true;
                previousMousePosition = { x: event.clientX, y: event.clientY };
                velocityX = 0;
                velocityY = 0;
                document.body.style.cursor = "grabbing";
            }
        };

        const onMouseMove = (event: MouseEvent) => {
            if (!isDragging) {
                // Update cursor when hovering over globe
                if (isOverGlobe(event.clientX, event.clientY)) {
                    document.body.style.cursor = "grab";
                } else {
                    document.body.style.cursor = "";
                }
                return;
            }

            event.preventDefault();
            const deltaX = event.clientX - previousMousePosition.x;
            const deltaY = event.clientY - previousMousePosition.y;

            // Update velocity for momentum
            velocityX = deltaX * DRAG_SENSITIVITY;
            velocityY = deltaY * DRAG_SENSITIVITY;

            // Apply rotation
            userRotationY += velocityX;
            userRotationX += velocityY;

            // Clamp vertical rotation to prevent flipping
            userRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userRotationX));

            previousMousePosition = { x: event.clientX, y: event.clientY };
            lastInteractionTime = performance.now();
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                lastInteractionTime = performance.now();
                document.body.style.cursor = "";
            }
        };

        // Touch event handlers
        const onTouchStart = (event: TouchEvent) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                if (isOverGlobe(touch.clientX, touch.clientY)) {
                    isDragging = true;
                    previousMousePosition = { x: touch.clientX, y: touch.clientY };
                    velocityX = 0;
                    velocityY = 0;
                }
            }
        };

        const onTouchMove = (event: TouchEvent) => {
            if (!isDragging || event.touches.length !== 1) return;

            const touch = event.touches[0];
            const deltaX = touch.clientX - previousMousePosition.x;
            const deltaY = touch.clientY - previousMousePosition.y;

            velocityX = deltaX * DRAG_SENSITIVITY;
            velocityY = deltaY * DRAG_SENSITIVITY;

            userRotationY += velocityX;
            userRotationX += velocityY;
            userRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userRotationX));

            previousMousePosition = { x: touch.clientX, y: touch.clientY };
            lastInteractionTime = performance.now();
        };

        const onTouchEnd = () => {
            if (isDragging) {
                isDragging = false;
                lastInteractionTime = performance.now();
            }
        };

        // Add event listeners at document level (canvas has pointer-events: none)
        document.addEventListener("mousedown", onMouseDown, true);
        document.addEventListener("mousemove", onMouseMove, true);
        document.addEventListener("mouseup", onMouseUp, true);
        document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
        document.addEventListener("touchmove", onTouchMove, { passive: true, capture: true });
        document.addEventListener("touchend", onTouchEnd, true);

        // Animation
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();
            const now = performance.now();

            // Update shaders
            spaceUniforms.uTime.value = elapsed;
            globeUniforms.uTime.value = elapsed;

            // Apply momentum when not dragging
            if (!isDragging) {
                userRotationY += velocityX;
                userRotationX += velocityY;
                userRotationX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, userRotationX));

                // Apply friction to slow down
                velocityX *= FRICTION;
                velocityY *= FRICTION;

                // Stop very small velocities
                if (Math.abs(velocityX) < 0.0001) velocityX = 0;
                if (Math.abs(velocityY) < 0.0001) velocityY = 0;

                // Realign to original rotation after delay
                const timeSinceInteraction = now - lastInteractionTime;
                if (timeSinceInteraction > REALIGN_DELAY && velocityX === 0 && velocityY === 0) {
                    // Smoothly interpolate back to zero
                    userRotationX *= (1 - REALIGN_SPEED);
                    userRotationY *= (1 - REALIGN_SPEED);

                    // Snap to zero when close enough
                    if (Math.abs(userRotationX) < 0.001) userRotationX = 0;
                    if (Math.abs(userRotationY) < 0.001) userRotationY = 0;
                }
            }

            // Base rotation (auto-spin) + user rotation
            const baseRotation = elapsed * 0.08;
            globe.rotation.y = baseRotation + userRotationY;
            globe.rotation.x = userRotationX;

            // Particles drift opposite
            particles.rotation.y = -elapsed * 0.03;

            // Render background first, then main scene
            renderer.autoClear = false;
            renderer.clear();
            renderer.render(bgScene, bgCamera);
            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!container) return;

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
            spaceUniforms.uResolution.value.set(container.clientWidth, container.clientHeight);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationId);

            // Remove drag event listeners
            document.removeEventListener("mousedown", onMouseDown, true);
            document.removeEventListener("mousemove", onMouseMove, true);
            document.removeEventListener("mouseup", onMouseUp, true);
            document.removeEventListener("touchstart", onTouchStart, true);
            document.removeEventListener("touchmove", onTouchMove, true);
            document.removeEventListener("touchend", onTouchEnd, true);

            if (rendererRef.current && container) {
                container.removeChild(rendererRef.current.domElement);
                rendererRef.current.dispose();
            }

            globeGeometry.dispose();
            globeMaterial.dispose();
            ringGeometry.dispose();
            ringMaterial.dispose();
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            spaceGeometry.dispose();
            spaceMaterial.dispose();

            if (landTextureRef.current) {
                landTextureRef.current.dispose();
            }
            if (cityLightsTextureRef.current) {
                cityLightsTextureRef.current.dispose();
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
}
