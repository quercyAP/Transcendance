import React, { useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial } from "three";
import * as THREE from 'three';

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
    uniform float u_opacity;

    void main() {
        // Calculez une pseudo-normale basée sur la position du fragment par rapport au centre de la face
        vec3 pseudoNormal = normalize(vPosition - vec3(0.2, 0.2, 1));

        // Utilisez cette pseudo-normale pour déterminer l'intensité du "glow"
        float intensity = pow(0.3 - dot(pseudoNormal, vec3(0, 0, 1.0)), 2.0);

        // Calculez la couleur finale basée sur l'intensité
        gl_FragColor = vec4(1.0, 0, 1.0, u_opacity) * intensity;
    }
`;

type Particle = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    scale: number;
    opacity: number;
};

const Particles = ({ ballPosition }: { ballPosition: THREE.Vector3 }) => {
    const particleCount = 10;
    const [particles, setParticles] = useState<Particle[]>([]);

    const edgesGeometry = useMemo(() => {
        const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
        return new THREE.EdgesGeometry(boxGeometry);
    }, []);

    const shaderMaterial = useMemo(() => new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            u_opacity: { value: 0.5 }
        },
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
    }), []);

    useEffect(() => {
        const tempParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
            tempParticles.push({
                position: new THREE.Vector3(ballPosition.x, ballPosition.y, ballPosition.z),
                velocity: new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 0.2),
                life: Math.random() * 2,
                scale: 2,
                opacity: 1,
            });
        }
        setParticles(tempParticles);
    }, []);

    useFrame((state, delta) => {
        setParticles(prevParticles =>
            prevParticles.map(particle => {
                let newLife = particle.life - (delta + 0.1);
                if (particle.life <= 0) {
                    const luck = Math.random() > 0.5 ? true : false;
                    return {
                        ...particle,
                        position: new THREE.Vector3(ballPosition.x + (luck ? 1.5 : -1.5), ballPosition.y + (luck ? 1.5 : -1.5), ballPosition.z),
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 1, (Math.random() - 0.5) * 1, (Math.random() - 0.5) * 0.5),
                        life: Math.random() * 2,
                        scale: 2,
                        opacity: 1,
                    };
                } else {
                    let newOpacity = newLife > 0 ? particle.opacity * Math.pow(newLife / particle.life, 3) : 0;
                    const newPosition = particle.position.clone().add(particle.velocity.clone().multiplyScalar(delta + 0.3));
                    const newScale = particle.scale + (Math.random() - 0.5) * 0.5;
                    return {
                        ...particle,
                        position: newPosition,
                        life: newLife,
                        scale: Math.max(0.1, newScale),
                        opacity: newOpacity,
                    };
                }
            })
        );
    });

    return (
        <>
            {particles.map((particle, index) => {
                return (
                    <lineSegments
                        key={index}
                        position={particle.position.toArray()}
                        scale={[particle.scale, particle.scale, particle.scale]}
                    >
                        <primitive attach="geometry" object={edgesGeometry} />
                        <primitive attach="material" object={shaderMaterial} />
                    </lineSegments>
                )
            })}
        </>
    );
};

export default Particles;
