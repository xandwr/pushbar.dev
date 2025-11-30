"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";

// Camera view configurations
// Camera position is fixed - only rotation (lookAt) and FOV change between views
type CameraView = {
    lookAt: { x: number; y: number; z: number };
    fov: number;
};

const CAMERA_POSITION = { x: 0, y: 0, z: 2.5 };

const CAMERA_VIEWS: Record<string, CameraView> = {
    landing: {
        lookAt: { x: 0, y: 0, z: 0 },
        fov: 45,
    },
    stargazer: {
        lookAt: { x: 1.0, y: 2.0, z: 0 },
        fov: 30,
    },
};

const getViewForPath = (pathname: string): CameraView => {
    return pathname === "/" ? CAMERA_VIEWS.landing : CAMERA_VIEWS.stargazer;
};

// 3D Star particle shader - renders stars with twinkle effect
const starVertexShader = `
attribute float aSize;
attribute float aSeed;
attribute vec3 aColor;

uniform float uTime;
uniform float uPixelRatio;

varying vec3 vColor;
varying float vSeed;
varying float vSize;

void main() {
    vColor = aColor;
    vSeed = aSeed;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Size attenuation - smaller base, gentler falloff with distance
    float size = aSize * uPixelRatio * (80.0 / -mvPosition.z);
    size = clamp(size, 1.0, 4.0);
    vSize = size;

    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const starFragmentShader = `
uniform float uTime;

varying vec3 vColor;
varying float vSeed;
varying float vSize;

void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);

    // Sharp circular core with subtle glow
    // Smaller stars are sharper, larger stars have slight glow
    float coreRadius = 0.15;
    float glowRadius = 0.5;

    // Discard outside the point
    if (dist > glowRadius) discard;

    // Sharp bright core
    float core = 1.0 - smoothstep(0.0, coreRadius, dist);

    // Subtle outer glow (only for larger stars)
    float glow = (1.0 - smoothstep(coreRadius, glowRadius, dist)) * 0.3;

    float alpha = core + glow * (vSize / 4.0);

    // Twinkle effect - subtle variation
    float twinkle = 0.85 + 0.15 * sin(uTime * 1.5 + vSeed * 100.0);

    gl_FragColor = vec4(vColor * twinkle, alpha);
}
`;

// Wispy galactic cloud shader - FBM-based distant nebula
const wispyCloudVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const wispyCloudFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uOffset;
uniform float uScale;

varying vec2 vUv;

// Hash for noise
float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

// Smooth value noise
float valueNoise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM for organic wispy shapes
float fbm(vec2 uv) {
    float n = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 6; i++) {
        vec2 drift = vec2(
            sin(uTime * 0.008 + float(i) * 0.7) * 0.2,
            cos(uTime * 0.006 + float(i) * 1.1) * 0.15
        );
        n += amplitude * valueNoise(uv * frequency + drift);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return n;
}

void main() {
    vec2 uv = vUv * uScale + uOffset;

    // Create wispy cloud shape with FBM
    float noise = fbm(uv);

    // Wispy threshold - creates thin streaky clouds
    float wisp = smoothstep(0.35, 0.65, noise);

    // Secondary layer for depth
    float noise2 = fbm(uv * 1.5 + vec2(3.7, 2.1));
    float wisp2 = smoothstep(0.4, 0.7, noise2) * 0.5;

    float combined = wisp + wisp2;

    // Soft radial fade from center
    float dist = length(vUv - 0.5);
    float fade = 1.0 - smoothstep(0.2, 0.5, dist);

    float alpha = combined * fade * uOpacity;

    gl_FragColor = vec4(uColor, alpha);
}
`;

// Nebula cloud shader - volumetric-like effect on billboard planes
const nebulaVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const nebulaFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uOffset;

varying vec2 vUv;
varying vec3 vWorldPosition;

// Hash for noise
float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

// Smooth value noise
float valueNoise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM for organic cloud shapes
float fbm(vec2 uv) {
    float n = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < 5; i++) {
        vec2 offset = vec2(
            sin(uTime * 0.02 + float(i) * 0.7) * 0.3,
            cos(uTime * 0.015 + float(i) * 1.1) * 0.2
        );
        n += amplitude * valueNoise(uv * frequency + offset);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return n;
}

void main() {
    vec2 uv = vUv + uOffset;

    // Create organic cloud shape
    float noise = fbm(uv * 3.0);
    noise = smoothstep(0.3, 0.7, noise);

    // Fade at edges for soft blend
    float edgeFade = 1.0 - smoothstep(0.3, 0.5, length(vUv - 0.5));

    float alpha = noise * edgeFade * uOpacity;

    gl_FragColor = vec4(uColor, alpha);
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

    // Track pathname for camera transitions
    const pathname = usePathname();
    const pathnameRef = useRef(pathname);

    // Update ref when pathname changes
    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x010203); // Deep space dark blue-black

        // Camera - fixed position, only rotation and FOV change
        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);

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

        // === 3D STAR FIELD ===
        const starCount = 3000;
        const starPositions = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        const starSeeds = new Float32Array(starCount);
        const starColors = new Float32Array(starCount * 3);

        // Distribute stars in a large sphere around the scene
        const STAR_SPHERE_RADIUS = 50;
        for (let i = 0; i < starCount; i++) {
            // Random position on sphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = STAR_SPHERE_RADIUS * (0.5 + Math.random() * 0.5);

            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);

            // Random size - mostly tiny pinpoints, few brighter stars
            const sizeRand = Math.random();
            if (sizeRand > 0.98) {
                starSizes[i] = 2.5 + Math.random() * 1.5; // Rare bright stars (2%)
            } else if (sizeRand > 0.9) {
                starSizes[i] = 1.5 + Math.random() * 1.0; // Medium stars (8%)
            } else {
                starSizes[i] = 0.8 + Math.random() * 0.7; // Small pinpoints (90%)
            }

            // Random seed for twinkle timing
            starSeeds[i] = Math.random();

            // Color variation - mostly cool colors with some green accent
            const colorRand = Math.random();
            if (colorRand > 0.85) {
                // Hacker green stars (15%)
                starColors[i * 3] = 0.2;
                starColors[i * 3 + 1] = 0.9;
                starColors[i * 3 + 2] = 0.5;
            } else if (colorRand > 0.7) {
                // Warm white stars (15%)
                starColors[i * 3] = 0.9;
                starColors[i * 3 + 1] = 0.85;
                starColors[i * 3 + 2] = 0.7;
            } else {
                // Cool blue-white stars (70%)
                starColors[i * 3] = 0.6 + Math.random() * 0.3;
                starColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
                starColors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
            }
        }

        const starGeometry = new THREE.BufferGeometry();
        starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute("aSize", new THREE.BufferAttribute(starSizes, 1));
        starGeometry.setAttribute("aSeed", new THREE.BufferAttribute(starSeeds, 1));
        starGeometry.setAttribute("aColor", new THREE.BufferAttribute(starColors, 3));

        const starUniforms = {
            uTime: { value: 0 },
            uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        };

        const starMaterial = new THREE.ShaderMaterial({
            vertexShader: starVertexShader,
            fragmentShader: starFragmentShader,
            uniforms: starUniforms,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // === WISPY GALACTIC CLOUDS ===
        // FBM-based billboard planes for that distant, organic milky way feel
        const wispyCloudGroup = new THREE.Group();
        scene.add(wispyCloudGroup);

        // Teal/emerald color palette
        const cloudColors = [
            new THREE.Color(0.04, 0.45, 0.32),  // Emerald
            new THREE.Color(0.02, 0.35, 0.40),  // Teal
            new THREE.Color(0.03, 0.28, 0.35),  // Deep teal
            new THREE.Color(0.05, 0.50, 0.38),  // Bright emerald
            new THREE.Color(0.02, 0.30, 0.45),  // Cyan-teal
        ];

        const wispyCloudConfigs = [
            // Main band across the view - large, subtle
            { position: new THREE.Vector3(0, 2, -20), scale: 40, color: cloudColors[0], opacity: 0.08, offset: [0, 0], uvScale: 2.0 },
            { position: new THREE.Vector3(8, 1, -18), scale: 35, color: cloudColors[1], opacity: 0.06, offset: [3.1, 1.2], uvScale: 2.5 },
            { position: new THREE.Vector3(-10, 3, -22), scale: 45, color: cloudColors[2], opacity: 0.07, offset: [5.5, 2.8], uvScale: 1.8 },
            // Upper wisps
            { position: new THREE.Vector3(5, 6, -25), scale: 30, color: cloudColors[3], opacity: 0.05, offset: [1.7, 4.3], uvScale: 3.0 },
            { position: new THREE.Vector3(-8, 5, -23), scale: 28, color: cloudColors[4], opacity: 0.05, offset: [8.2, 0.5], uvScale: 2.8 },
            // Lower subtle wisps
            { position: new THREE.Vector3(12, -1, -19), scale: 25, color: cloudColors[1], opacity: 0.04, offset: [2.4, 6.1], uvScale: 3.2 },
            { position: new THREE.Vector3(-15, 0, -24), scale: 32, color: cloudColors[2], opacity: 0.05, offset: [4.8, 3.3], uvScale: 2.2 },
            // Distant background layer
            { position: new THREE.Vector3(0, 2, -35), scale: 60, color: cloudColors[0], opacity: 0.04, offset: [7.0, 1.8], uvScale: 1.5 },
            { position: new THREE.Vector3(15, 4, -38), scale: 50, color: cloudColors[3], opacity: 0.03, offset: [0.3, 5.5], uvScale: 1.8 },
            { position: new THREE.Vector3(-12, 1, -40), scale: 55, color: cloudColors[4], opacity: 0.035, offset: [6.2, 2.1], uvScale: 1.6 },
        ];

        const wispyMeshes: THREE.Mesh[] = [];
        const wispyUniformsList: { uTime: { value: number }; uColor: { value: THREE.Color }; uOpacity: { value: number }; uOffset: { value: THREE.Vector2 }; uScale: { value: number } }[] = [];

        wispyCloudConfigs.forEach((config) => {
            const wispyUniforms = {
                uTime: { value: 0 },
                uColor: { value: config.color },
                uOpacity: { value: config.opacity },
                uOffset: { value: new THREE.Vector2(config.offset[0], config.offset[1]) },
                uScale: { value: config.uvScale },
            };
            wispyUniformsList.push(wispyUniforms);

            const wispyMaterial = new THREE.ShaderMaterial({
                vertexShader: wispyCloudVertexShader,
                fragmentShader: wispyCloudFragmentShader,
                uniforms: wispyUniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            });

            const wispyGeometry = new THREE.PlaneGeometry(config.scale, config.scale);
            const wispyMesh = new THREE.Mesh(wispyGeometry, wispyMaterial);
            wispyMesh.position.copy(config.position);
            wispyMeshes.push(wispyMesh);
            wispyCloudGroup.add(wispyMesh);
        });

        // === 3D NEBULA CLOUDS ===
        // Create multiple billboard planes at different depths for volumetric effect
        const nebulaGroup = new THREE.Group();
        scene.add(nebulaGroup);

        const nebulaConfigs = [
            { position: new THREE.Vector3(-15, 8, -30), scale: 25, color: new THREE.Color(0.02, 0.06, 0.08), opacity: 0.15, offset: [0, 0] },
            { position: new THREE.Vector3(20, -5, -25), scale: 20, color: new THREE.Color(0.01, 0.04, 0.06), opacity: 0.12, offset: [5.2, 3.1] },
            { position: new THREE.Vector3(-8, 12, -35), scale: 30, color: new THREE.Color(0.01, 0.05, 0.03), opacity: 0.1, offset: [8.5, 1.7] },
            { position: new THREE.Vector3(12, 15, -40), scale: 35, color: new THREE.Color(0.03, 0.05, 0.06), opacity: 0.08, offset: [2.3, 4.5] },
            { position: new THREE.Vector3(-20, -10, -28), scale: 22, color: new THREE.Color(0.02, 0.04, 0.05), opacity: 0.1, offset: [7.1, 2.2] },
        ];

        const nebulaMeshes: THREE.Mesh[] = [];
        const nebulaUniformsList: { uTime: { value: number }; uColor: { value: THREE.Color }; uOpacity: { value: number }; uOffset: { value: THREE.Vector2 } }[] = [];

        nebulaConfigs.forEach((config) => {
            const nebulaUniforms = {
                uTime: { value: 0 },
                uColor: { value: config.color },
                uOpacity: { value: config.opacity },
                uOffset: { value: new THREE.Vector2(config.offset[0], config.offset[1]) },
            };
            nebulaUniformsList.push(nebulaUniforms);

            const nebulaMaterial = new THREE.ShaderMaterial({
                vertexShader: nebulaVertexShader,
                fragmentShader: nebulaFragmentShader,
                uniforms: nebulaUniforms,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
            });

            const nebulaGeometry = new THREE.PlaneGeometry(config.scale, config.scale);
            const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
            nebulaMesh.position.copy(config.position);
            nebulaMeshes.push(nebulaMesh);
            nebulaGroup.add(nebulaMesh);
        });

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

        // Camera tweening state
        const currentLookAt = new THREE.Vector3(0, 0, 0);
        const LERP_FACTOR = 0.03;

        // Animation
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();

            // Update shaders
            starUniforms.uTime.value = elapsed;
            globeUniforms.uTime.value = elapsed;

            // Update wispy cloud uniforms
            wispyUniformsList.forEach((uniforms) => {
                uniforms.uTime.value = elapsed;
            });

            // Update nebula uniforms
            nebulaUniformsList.forEach((uniforms) => {
                uniforms.uTime.value = elapsed;
            });

            // Make wispy clouds face the camera (billboard effect)
            wispyMeshes.forEach((mesh) => {
                mesh.lookAt(camera.position);
            });

            // Make nebula clouds face the camera (billboard effect)
            nebulaMeshes.forEach((mesh) => {
                mesh.lookAt(camera.position);
            });

            // Camera tweening based on current route
            // Only rotation (lookAt) and FOV change - position stays fixed
            const targetView = getViewForPath(pathnameRef.current);

            // Lerp lookAt target (controls rotation)
            currentLookAt.x += (targetView.lookAt.x - currentLookAt.x) * LERP_FACTOR;
            currentLookAt.y += (targetView.lookAt.y - currentLookAt.y) * LERP_FACTOR;
            currentLookAt.z += (targetView.lookAt.z - currentLookAt.z) * LERP_FACTOR;
            camera.lookAt(currentLookAt);

            // Lerp FOV
            camera.fov += (targetView.fov - camera.fov) * LERP_FACTOR;
            camera.updateProjectionMatrix();

            // Base rotation (auto-spin)
            const baseRotation = elapsed * 0.08;
            globe.rotation.y = baseRotation;

            // Particles drift opposite
            particles.rotation.y = -elapsed * 0.03;

            // Slow rotation for stars to add subtle movement
            stars.rotation.y = elapsed * 0.005;

            // Render scene
            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!container) return;

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
            const pixelRatio = Math.min(window.devicePixelRatio, 2);
            starUniforms.uPixelRatio.value = pixelRatio;
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationId);

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
            starGeometry.dispose();
            starMaterial.dispose();

            // Dispose wispy cloud resources
            wispyMeshes.forEach((mesh) => {
                mesh.geometry.dispose();
                (mesh.material as THREE.ShaderMaterial).dispose();
            });

            // Dispose nebula resources
            nebulaMeshes.forEach((mesh) => {
                mesh.geometry.dispose();
                (mesh.material as THREE.ShaderMaterial).dispose();
            });

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
