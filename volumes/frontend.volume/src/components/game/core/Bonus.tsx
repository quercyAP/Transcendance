import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, ShaderMaterial } from 'three';
import * as THREE from 'three';
import { BonusDto } from "../../../services/gameType";
import { BufferGeometry, LineSegments, Material } from 'three';

const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float u_time;

    void main() {
        vNormal = normal;
        vPosition = position; 

        vPosition.x += sin(vPosition.y * 5.0 + u_time * 2.0) * 0.3;
        vPosition.y += cos(vPosition.x * 5.0 + u_time * 2.0) * 0.3;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
    }
`;

const fragmentShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 u_color;

    void main() {
        // Calculez une pseudo-normale basée sur la position du fragment par rapport au centre de la face
        vec3 pseudoNormal = normalize(vPosition - vec3(0.2, 0.2, 1));

        // Utilisez cette pseudo-normale pour déterminer l'intensité du "glow"
        float intensity = pow(0.5 - dot(pseudoNormal, vec3(0, 0, 1.0)), 2.0);

        // Calculez la couleur finale basée sur l'intensité
        gl_FragColor = vec4(u_color, 5.0) * intensity;
    }
`;

const Bonus: React.FC<BonusDto> = ({ x, y, isVisible, color }) => {

  const mesh = useRef<LineSegments<BufferGeometry, Material | Material[]>>(null!);
  const shaderMaterial = useRef<ShaderMaterial>(null!);
  const posX = x ?? 0;
  const posY = y ?? -45;
  const trueColor = () => {
    if (color === "blue") {
      return new THREE.Vector3(0, 0, 1);
    } else if (color === "green") {
      return new THREE.Vector3(0, 1, 0);
    } else {
      return new THREE.Vector3(1, 0.6471, 0);
    }
  }

  useMemo(() => {
    shaderMaterial.current = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_color: { value: trueColor() },
        u_time: { value: 0 },
      },
      blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true,
    });
  }, []);

  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1);
    return new THREE.EdgesGeometry(boxGeometry);
  }, []);
  
  useFrame(({ clock }) => {
    if (mesh.current && shaderMaterial.current) {
      mesh.current.position.set(posX, posY, 0);
      mesh.current.visible = isVisible ?? false;
      shaderMaterial.current.uniforms.u_color.value = trueColor();
      shaderMaterial.current.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  return (
    <lineSegments
      ref={mesh}
      position={[0, 0, 0]}
      scale={[4, 4, 4]}
    >
      <primitive attach="geometry" object={edgesGeometry} />
      <primitive attach="material" object={shaderMaterial.current} />
    </lineSegments>
  );
};

export default Bonus;
