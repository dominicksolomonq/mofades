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

// Animation configuration - Elegant, premium feel
const ANIMATION_CONFIG = {
    windup: {
        duration: 0.8,        // longer wind-up for anticipation
        rotation: -0.15,      // subtle counter-clockwise (less aggressive)
    },
    fastspin: {
        duration: 2.5,        // slower, more elegant spin
        rotations: 1.5,       // fewer rotations for premium feel
    },
    transition: {
        duration: 2.0,        // longer transition for ultra-smooth deceleration
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

    let gltf;
    try {
        gltf = useGLTF(targetUrl);
    } catch {
        gltf = null;
    }

    if (gltf && onLoad) onLoad();
    if (!gltf && onError) onError();

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
            // Fast spin: rapid clockwise rotations
            const { duration, rotations } = ANIMATION_CONFIG.fastspin;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);

            const totalRotation = rotations * Math.PI * 2;
            currentRotation.current = phaseStartRotation.current + easedProgress * totalRotation;
            modelRef.current.rotation.y = currentRotation.current;

            if (progress >= 1) {
                phaseStartRotation.current = currentRotation.current;
                animationStartTime.current = now;
                animationPhase.current = 'transition';
            }
        } else if (animationPhase.current === 'transition') {
            // Transition: smooth deceleration from fast spin to idle speed
            const { duration } = ANIMATION_CONFIG.transition;
            const progress = Math.min(elapsed / duration, 1);

            // Calculate speeds in radians per second
            const idleSpeedRadPerSec = 0.8 * (Math.PI / 180) * 60; // ~0.838 rad/sec
            const startSpeedRadPerSec = 2; // Gentler start speed for elegant feel

            // Ultra-smooth interpolation using easeOutQuint for seamless deceleration
            const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
            const easedProgress = easeOutQuint(progress);

            const currentSpeedRadPerSec = startSpeedRadPerSec + (idleSpeedRadPerSec - startSpeedRadPerSec) * easedProgress;

            currentRotation.current += currentSpeedRadPerSec * delta;
            modelRef.current.rotation.y = currentRotation.current;

            if (progress >= 1) {
                animationPhase.current = 'idle';
                if (onAnimationComplete) {
                    onAnimationComplete();
                }
            }
        } else if (animationPhase.current === 'idle') {
            // Continue rotating the model at idle speed - seamless from transition
            const idleSpeedRadPerSec = 0.8 * (Math.PI / 180) * 60; // ~0.838 rad/sec
            currentRotation.current += idleSpeedRadPerSec * delta;
            modelRef.current.rotation.y = currentRotation.current;
        }
    });

    const responsiveScale = viewport.width < 5.5 ? viewport.width / 6.5 : 1;

    return (
        <group ref={groupRef} scale={[responsiveScale, responsiveScale, responsiveScale]}>
            <group ref={modelRef}>
                <Center>
                    {gltf ? (
                        <primitive object={gltf.scene} />
                    ) : (
                        <mesh>
                            <sphereGeometry args={[0.5, 32, 32]} />
                            <meshStandardMaterial color="#ff3333" metalness={0.8} roughness={0.2} />
                        </mesh>
                    )}
                </Center>
            </group>
        </group>
    );
};
