import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, Environment, OrbitControls, ContactShadows } from '@react-three/drei';
import { SceneModel } from './SceneModel';
import { ModelProps } from '../types';

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

            {/* Background */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            {/* Studio Environment for Reflections */}
            <Environment preset="city" blur={0.8} />

            {/* Studio Lighting Setup */}
            <ambientLight intensity={0.2} />

            {/* Main Key Light - Casting shadows */}
            <spotLight
                position={[10, 10, 10]}
                intensity={15}
                angle={0.4}
                penumbra={1}
                castShadow
                shadow-bias={-0.0001}
            />

            {/* Rim Light (Back Light) - Creates the silhouette/edge definition */}
            <spotLight
                position={[-5, 5, -5]}
                intensity={20}
                color="#aaccff"
                angle={0.5}
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