"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Types for GeoJSON
type GeoJSONFeature = {
    type: "Feature";
    geometry: {
        type: "LineString" | "MultiLineString";
        coordinates: number[][] | number[][][];
    };
};

type GeoJSON = {
    type: "FeatureCollection";
    features: GeoJSONFeature[];
};

// Convert lat/lon to 3D coordinates on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

export function Globe() {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const coastlinesRef = useRef<THREE.Group | null>(null);

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
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Globe geometry - smaller, opaque dark sphere
        const GLOBE_RADIUS = 0.8;
        const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

        const globeMaterial = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a, // Near black
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

        // Create coastlines group
        const coastlinesGroup = new THREE.Group();
        coastlinesRef.current = coastlinesGroup;
        globeGroup.add(coastlinesGroup);

        // Load and render coastlines
        const COASTLINE_RADIUS = GLOBE_RADIUS;

        fetch("/assets/ne_50m_coastline.json")
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((geojson: GeoJSON) => {
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x10b981,
                    transparent: true,
                    opacity: 0.9,
                });

                geojson.features.forEach((feature) => {
                    if (feature.geometry.type === "LineString") {
                        const coords = feature.geometry.coordinates as number[][];
                        const points: THREE.Vector3[] = [];

                        coords.forEach(([lon, lat]) => {
                            points.push(latLonToVector3(lat, lon, COASTLINE_RADIUS));
                        });

                        if (points.length > 1) {
                            const geometry = new THREE.BufferGeometry().setFromPoints(points);
                            const line = new THREE.Line(geometry, lineMaterial);
                            coastlinesGroup.add(line);
                        }
                    } else if (feature.geometry.type === "MultiLineString") {
                        const multiCoords = feature.geometry.coordinates as number[][][];

                        multiCoords.forEach((coords) => {
                            const points: THREE.Vector3[] = [];

                            coords.forEach(([lon, lat]) => {
                                points.push(latLonToVector3(lat, lon, COASTLINE_RADIUS));
                            });

                            if (points.length > 1) {
                                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                                const line = new THREE.Line(geometry, lineMaterial);
                                coastlinesGroup.add(line);
                            }
                        });
                    }
                });
            })
            .catch((err) => console.error("Failed to load coastlines:", err));

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
        const particleCount = 150;
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

        // Animation
        let animationId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationId = requestAnimationFrame(animate);

            const elapsed = clock.getElapsedTime();

            // Rotate everything together
            const rotation = elapsed * 0.08;
            globe.rotation.y = rotation;
            coastlinesGroup.rotation.y = rotation;

            // Particles drift opposite
            particles.rotation.y = -elapsed * 0.03;

            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        const handleResize = () => {
            if (!container) return;

            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
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
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 0 }}
        />
    );
}
