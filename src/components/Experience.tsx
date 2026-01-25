import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment, OrbitControls, ContactShadows, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { SceneModel } from './SceneModel';
import { ModelProps } from '../types';

// Interactive Light Component
const InteractiveLights: React.FC = () => {
    const light = useRef<THREE.SpotLight>(null);
    const { viewport } = useThree();

    useFrame((state) => {
        if (light.current) {
            // Move light based on pointer position for dynamic shadows
            // We invert X slightly to make shadows move naturally against the mouse
            const targetX = (state.pointer.x * viewport.width) / 3;
            const targetY = (state.pointer.y * viewport.height) / 3;

            light.current.position.x = THREE.MathUtils.lerp(light.current.position.x, targetX, 0.05);
            light.current.position.y = THREE.MathUtils.lerp(light.current.position.y, targetY, 0.05);
        }
    });

    return (
        <spotLight
            ref={light}
            position={[0, 0, 10]}
            intensity={8}
            color="#fff" // Clean white interaction light
            distance={25}
            angle={0.25}
            penumbra={1}
            castShadow
        />
    );
};

export const Experience: React.FC<ModelProps> = (props) => {
    // Track when entrance animation is complete (for potential future use)
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);

    const handleAnimationComplete = () => {
        setIsAnimationComplete(true);
    };

    return (
        <Canvas
            shadows // Enable shadow map
            dpr={[1, 1.5]} // Optimization: Limit pixel ratio to save GPU
            camera={{ position: [0, 0, 8], fov: 45 }}
            gl={{ antialias: true, alpha: true, toneMappingExposure: 1.2 }}
            className="w-full h-full"
            style={{ background: 'transparent' }}
        >
            {/* Controls removed to prevent any interaction/shifting */}
            {/* The model rotates itself in SceneModel.tsx */}

            {/* Cinematic Atmosphere */}
            <fog attach="fog" args={['#050505', 8, 25]} />
            <Sparkles count={800} scale={15} size={3} speed={0.3} opacity={0.4} color="#ffffff" />

            {/* Background Stars (Keep them but maybe fewer/fainter if we have sparkles) */}
            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

            {/* Studio Environment for Reflections */}
            <Environment preset="city" blur={0.8} />

            {/* Interactive Flashlight / Dynamic Shadow */}
            <InteractiveLights />

            {/* Enhanced Studio Lighting Setup */}
            <ambientLight intensity={0.3} />

            {/* Main Key Light - Cool White */}
            <spotLight
                position={[10, 10, 10]}
                intensity={20}
                angle={0.4}
                penumbra={1}
                castShadow
                shadow-bias={-0.0001}
                color="#eef2ff"
            />

            {/* Rim Light (Back Light) - Cyan/Blue Tint for Modern Feel */}
            <spotLight
                position={[-5, 5, -5]}
                intensity={25}
                color="#00ddff"
                angle={0.5}
                penumbra={1}
            />

            {/* Secondary Rim Light - Purple Tint for Contrast */}
            <spotLight
                position={[5, 0, -5]}
                intensity={15}
                color="#aa00ff"
                angle={0.6}
                penumbra={1}
            />

            {/* Fill Light */}
            <directionalLight position={[-5, 0, 5]} intensity={2} color="#ffffff" />

            {/* Model */}
            <Suspense fallback={null}>
                <SceneModel {...props} onAnimationComplete={handleAnimationComplete} />
            </Suspense>
        </Canvas>
    );
};