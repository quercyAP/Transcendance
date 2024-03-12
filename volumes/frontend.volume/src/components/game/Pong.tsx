"use client";
import React, { useEffect } from "react";
import { Text } from "@react-three/drei";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import Paddle from "./core/Paddle";
import Ball from "./core/Ball";
import Bonus from "./core/Bonus";
import { PongProps } from "../../services/gameType";
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Particles from "./core/Particles";
import * as THREE from 'three'
import Grid from "./core/Grid";
import { useGameRef } from "../../context/gameContext";

const GAME_WIDTH = 100;
const GAME_HEIGHT = 60;

const CameraController = () => {
  const { camera, size } = useThree();

  const calculateZoom = (width: number, height: number) => {
    const aspectRatio = width / height;
    const adaptedWidth = GAME_WIDTH * 1.1;
    const adaptedHeight = GAME_HEIGHT * 1.34;
    const gameAspectRatio = adaptedWidth / adaptedHeight;
    let zoom;

    if (aspectRatio > gameAspectRatio) {
      zoom = height / adaptedHeight;
    } else {
      zoom = width / adaptedWidth;
    }

    return zoom;
  };

  useEffect(() => {
    camera.zoom = calculateZoom(size.width, size.height);
    camera.updateProjectionMatrix();

  }, [size]);

  return null;
};

export const Pong: React.FC<PongProps> = ({
  playerId1, playerId2, showGrid
}) => {
  const { gameState, ballPosition } = useGameRef();
  const cameraZoom = 1;

  return (
    <Canvas
      style={{ cursor: "none" }}
      orthographic
      camera={{ zoom: cameraZoom }}
    >
      <ambientLight />
      <CameraController />
      <EffectComposer>
        <Bloom
          kernelSize={3} // convolution kernel size
          luminanceThreshold={0} // luminance threshold. Raise this to cut off darker areas.
          luminanceSmoothing={0.1} // smoothness of the luminance threshold. Lower values look more 'sharp'.
          intensity={0.2} // The overall intensity of the effect.
        />
      </EffectComposer>
      <Text
        position={[0, GAME_HEIGHT / 2 + 5, 0]}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontSize={8}
      >
        {gameState?.score?.left ?? 0} - {gameState?.score?.right ?? 0}
      </Text>
      <Ball/>
      {showGrid &&
        <>
          <Grid
            ballPosition={ballPosition}
            color={new THREE.Vector3(1.0, 0.9294, 0.7333)}
            width={80}
            pos={new THREE.Vector3(0, 0, -3)}
            divisionsX={15}
            bonusColision={new THREE.Vector3(gameState?.bonus?.prevPos?.x, gameState?.bonus?.prevPos?.y, 0)}
            bonusColor={gameState?.bonus?.color}
          />
          <Grid
            ballPosition={ballPosition}
            color={new THREE.Vector3(0, 0, 0)}
            width={10}
            pos={new THREE.Vector3(-45, 0, -3)}
            divisionsX={2}
          />
          <Grid
            ballPosition={ballPosition}
            color={new THREE.Vector3(0, 0, 0)}
            width={10}
            pos={new THREE.Vector3(45, 0, -3)}
            divisionsX={2}
          />
        </>
      }
      <Particles ballPosition={ballPosition} />
      <Bonus
        x={gameState?.bonus?.x}
        y={gameState?.bonus?.y}
        isVisible={gameState?.bonus?.isVisible}
        color={gameState?.bonus?.color}
      />
      <Paddle
        x={gameState?.paddles?.[playerId1!]?.x ?? - (GAME_WIDTH / 2) + 4}
        y={gameState?.paddles?.[playerId1!]?.y ?? 0}
      />
      <Paddle
        x={gameState?.paddles?.[playerId2!]?.x ?? GAME_WIDTH / 2 - 4}
        y={gameState?.paddles?.[playerId2!]?.y ?? 0}
      />
      <mesh
        position={[-(GAME_WIDTH / 2), 0, 0]}
      >
        <boxGeometry args={[1, (GAME_HEIGHT) + 1, 1]} />
        <meshStandardMaterial color={"#ff00ff"} />
      </mesh>
      <mesh
        position={[(GAME_WIDTH / 2), 0, 0]}
      >
        <boxGeometry args={[1, (GAME_HEIGHT) + 1, 1]} />
        <meshStandardMaterial color={"#ff00ff"} />
      </mesh>
      <mesh
        position={[0, -(GAME_HEIGHT / 2), 0]}
      >
        <boxGeometry args={[(GAME_WIDTH), 1, 1]} />
        <meshStandardMaterial color={"#ff00ff"} />
      </mesh>
      <mesh
        position={[0, (GAME_HEIGHT / 2), 0]}
      >
        <boxGeometry args={[(GAME_WIDTH), 1, 1]} />
        <meshStandardMaterial color={"#ff00ff"} />
      </mesh>
    </Canvas>
  );
};

export default Pong;
