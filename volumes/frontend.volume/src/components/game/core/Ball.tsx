import React from "react";
import { useFrame } from "@react-three/fiber";
import { useGameRef } from "../../../context/gameContext";

const Ball: React.FC = () => {
  const {
    gameState, ballMesh, ballShaderMaterial, ballEdgesGeometry
  } = useGameRef();

  const posX = gameState?.ball?.x ?? 0;
  const posY = gameState?.ball?.y ?? 0;

  useFrame(() => {
    if (ballMesh?.current) {
      ballMesh?.current.position.set(posX, posY, 0);
    }
  });

  return (
    <lineSegments
      ref={ballMesh}
      position={[posX, posY, 0]}
      scale={[4, 4, 4]}
      name="ball"
    >
      <primitive attach="geometry" object={ballEdgesGeometry} />
      <primitive attach="material" object={ballShaderMaterial} />
    </lineSegments>
  );
};

export default Ball;
