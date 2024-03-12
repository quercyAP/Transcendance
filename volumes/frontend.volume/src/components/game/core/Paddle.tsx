import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial } from 'three';
import { PaddleDto } from '../../../services/gameType';
import * as THREE from 'three';
import { BufferGeometry, LineSegments, Material } from 'three';

const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vNormal = normal;
        vPosition = position; // Ajoutez la position du sommet comme variable variant
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        // Calculez une pseudo-normale basée sur la position du fragment par rapport au centre de la face
        vec3 pseudoNormal = normalize(vPosition - vec3(0.2, 0.2, 1));

        // Utilisez cette pseudo-normale pour déterminer l'intensité du "glow"
        float intensity = pow(0.5 - dot(pseudoNormal, vec3(0, 0, 1.0)), 2.0);

        // Calculez la couleur finale basée sur l'intensité
        gl_FragColor = vec4(0, 0.5, 1.0, 3.0) * intensity;
    }
`;


const Paddle: React.FC<PaddleDto> = ({ x, y }) => {
    const mesh = useRef<LineSegments<BufferGeometry, Material | Material[]>>(null);

    const posX = x ?? 0;
    const posY = y ?? 0;

    const shaderMaterial = useMemo(() => new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
        },
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
    }), []);

    const edgesGeometry = useMemo(() => {
        const boxGeometry = new THREE.BoxGeometry(1, 3, 1);
        return new THREE.EdgesGeometry(boxGeometry);
    }, []);

    useFrame(() => {
        if (mesh.current) {
            mesh.current.position.set(posX, posY, 0);
        }
    });

    return (
        <lineSegments
            ref={mesh}
            position={[posX, posY, 0]}
            scale={[4, 4, 4]}
        >
            <primitive attach="geometry" object={edgesGeometry} />
            <primitive attach="material" object={shaderMaterial} />
        </lineSegments>
    );
};

export default Paddle;