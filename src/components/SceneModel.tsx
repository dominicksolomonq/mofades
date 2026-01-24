import React, { useRef, useLayoutEffect, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { ModelProps } from '../types';

// Easing function for smooth animations
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

// Animation phase types
type AnimationPhase = 'windup' | 'fastspin' | 'transition' | 'idle';

// Animation configuration - Elegant, premium feel with slower, smoother animation
const ANIMATION_CONFIG = {
    windup: {
        duration: 1.2,        // longer wind-up for anticipation and model loading time
        rotation: -0.1,       // very subtle counter-clockwise (more elegant)
    },
    fastspin: {
        duration: 3.5,        // much slower, more elegant spin
        rotations: 1.0,       // just one rotation for premium feel
    },
    transition: {
        duration: 2.5,        // longer transition for ultra-smooth deceleration
    }
};

interface ExtendedModelProps extends ModelProps {
    onAnimationComplete?: () => void;
}

export const SceneModel: React.FC<ExtendedModelProps> = ({ url, onError, onLoad, onAnimationComplete }) => {
    const groupRef = useRef<THREE.Group>(null);
    const modelRef = useRef<THREE.Group>(null);
    const { viewport } = useThree();

    // Animation state - using refs to avoid React state update delays
    const animationPhase = useRef<AnimationPhase>('windup');
    const animationStartTime = useRef<number>(0);
    const currentRotation = useRef<number>(0);
    const phaseStartRotation = useRef<number>(0);
    const isInitialized = useRef<boolean>(false);

    const targetUrl = url || '/test123.glb';

    // Use useGLTF hook directly - this will suspend if loading
    const gltf = useGLTF(targetUrl);

    // Call onLoad when the component mounts (which happens after Suspense finishes)
    useEffect(() => {
        if (gltf && onLoad) onLoad();
    }, [gltf, onLoad]);

    // Handle any errors that might slip through (though likely caught by ErrorBoundary)
    useEffect(() => {
        if (!gltf && onError) onError();
    }, [gltf, onError]);

    // --- Metallic Material (hell, glossy, hochwertig) ---
    const metalMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#cccccc"),        // helles Metall
        metalness: 1.0,                           // voller Metallanteil
        roughness: 0.15,                          // leicht matt, nicht spiegelglatt
        clearcoat: 0.8,                           // glossy Topcoat
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.5,                     // nicht zu übertrieben
        reflectivity: 0.9                         // schöne Reflektionen
    });

    // Material automatisch auf GLB anwenden
    useLayoutEffect(() => {
        if (!gltf) return;

        gltf.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.material = metalMaterial;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
    }, [gltf]);

    // Initialize animation timing - start immediately regardless of model load
    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            animationStartTime.current = performance.now() / 1000;
        }
    }, []);

    // Entrance animation + Float
    const lastFrameTime = useRef<number>(0);

    useFrame((state) => {
        if (!groupRef.current || !modelRef.current) return;

        const t = state.clock.getElapsedTime();

        // Float animation (always active)
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;

        // Skip rotation animation if not initialized
        if (!isInitialized.current) return;

        const now = performance.now() / 1000;
        const elapsed = now - animationStartTime.current;

        // Calculate delta using our own tracking (more reliable than getDelta with React state)
        const delta = lastFrameTime.current > 0 ? now - lastFrameTime.current : 0.016;
        lastFrameTime.current = now;

        if (animationPhase.current === 'windup') {
            // Wind-up: brief counter-clockwise rotation
            const { duration, rotation } = ANIMATION_CONFIG.windup;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeInOutCubic(progress);

            currentRotation.current = easedProgress * rotation;
            modelRef.current.rotation.y = currentRotation.current;

            if (progress >= 1) {
                phaseStartRotation.current = currentRotation.current;
                animationStartTime.current = now;
                animationPhase.current = 'fastspin';
            }
        } else if (animationPhase.current === 'fastspin') {
            // Velocity-based animation logic for perfect smoothness
            // We interpolate velocity instead of position to ensure momentum is conserved

            const spinDuration = 3.5;
            const startVelocity = 12.0; // Fast initial spin
            const targetIdleVelocity = 0.5;   // Must match the idle speed exactly

            const progress = Math.min(elapsed / spinDuration, 1);

            // Cubic out easing for velocity drop-off
            const velocityProgress = 1 - Math.pow(1 - progress, 3);

            // Current angular velocity
            const currentVelocity = startVelocity - (startVelocity - targetIdleVelocity) * velocityProgress;

            // Integrate velocity to get new position
            currentRotation.current += currentVelocity * delta;
            modelRef.current.rotation.y = currentRotation.current;

            if (progress >= 1) {
                animationPhase.current = 'idle';
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            }
        } else if (animationPhase.current === 'idle') {
            // Continue rotating the model at constant idle speed - never stops
            const idleSpeedRadPerSec = 0.5;
            currentRotation.current += idleSpeedRadPerSec * delta;
            modelRef.current.rotation.y = currentRotation.current;
        }
    });

    // Responsive scaling and positioning
    // User request: "smaller for mobile... more in the back"
    const isMobile = viewport.width < 5;

    const responsiveScale = isMobile
        ? 0.35   // Mobile: Significantly smaller
        : viewport.width < 7
            ? 0.65   // Tablet
            : 0.85;  // Desktop

    // Push model back on mobile to fit screen better (Perspective Camera effect + literal position)
    const responsivePositionZ = isMobile ? -1.5 : 0;

    return (
        <group ref={groupRef} scale={[responsiveScale, responsiveScale, responsiveScale]} position={[0, 0, responsivePositionZ]}>
            <group ref={modelRef}>
                <Center>
                    <primitive object={gltf.scene} />
                </Center>
            </group>
        </group>
    );
};

// Preload the default model to ensure instant loading
useGLTF.preload('/test123.glb');
