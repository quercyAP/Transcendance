"use client";
import React, { createContext, useRef, useState, useContext, useMemo } from "react";
import { GameState } from "../services/gameType";
import * as THREE from "three";
import { LineSegments } from 'three';
import { ballShader } from "../shader/BallShader";
import { BufferGeometry, Material } from "three";

interface GameContextType {
    // Three Scene

    // GameState
    gameState: GameState | undefined;
    setGameState: React.Dispatch<React.SetStateAction<GameState | undefined>>;
    ballPosition: THREE.Vector3;

    // Ball Utils
    ballMesh: React.RefObject<LineSegments<BufferGeometry, Material | Material[]>>;
    ballShaderMaterial: THREE.ShaderMaterial;
    ballEdgesGeometry: THREE.EdgesGeometry;

    // Grid Utils
    
}

const gameContext = createContext<GameContextType>({
    // Three Scene

    // GameState
    gameState: undefined,
    setGameState: () => { },
    ballPosition: new THREE.Vector3(0, 0, 0),

    // Ball Utils
    ballMesh: { current: null },
    ballShaderMaterial: new THREE.ShaderMaterial(),
    ballEdgesGeometry: new THREE.EdgesGeometry()
})

export const useGameRef = () => useContext(gameContext);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
    const [gameState, setGameState] = useState<GameState>();
    const ballPosition = new THREE.Vector3(gameState?.ball?.x, gameState?.ball?.y, 0);
    const ballEdgesGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);

    const ballMesh = useRef<LineSegments<BufferGeometry, Material | Material[]>>(null!);
    const ballShaderMaterial = useMemo(() => new THREE.ShaderMaterial({
        vertexShader: ballShader.vertexShader,
        fragmentShader: ballShader.fragmentShader,
        uniforms: {},
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
      }), []);

    const contextValue = {
        gameState,
        setGameState,
        ballPosition,
        ballMesh,
        ballShaderMaterial,
        ballEdgesGeometry
    }

    return (
        <gameContext.Provider value={contextValue}>{children}</gameContext.Provider>
    )
};