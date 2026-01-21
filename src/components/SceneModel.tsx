import React, { useRef, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import { ModelProps } from '../types';

export const SceneModel: React.FC<ModelProps> = ({ url, onError, onLoad }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { viewport } = useThree();

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

    // Float
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.1;
    });

    const responsiveScale = viewport.width < 5.5 ? viewport.width / 6.5 : 1;

    return (
        <group ref={groupRef} scale={[responsiveScale, responsiveScale, responsiveScale]}>
            <Center>
                {gltf ? (
                    <primitive object={gltf.scene} />
                ) : (
                    <mesh>
                        <circleGeometry args={[0.5, 32]} />
                        <meshBasicMaterial color="red" />
                    </mesh>
                )}
            </Center>
        </group>
    );
};
