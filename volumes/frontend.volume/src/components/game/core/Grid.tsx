import * as THREE from 'three';
import { useMemo, useRef, useEffect, useState } from 'react';
import { ShaderMaterial } from 'three';
import { useThree, useFrame } from '@react-three/fiber';

const vertexShader = `
uniform vec3 u_ballPosition;
uniform float u_time;
uniform vec3 u_position;
uniform vec3 u_bonusPos;
uniform float u_waveStart;

void main() {
    vec3 pos = u_position + position;
    float distanceToBall = length(u_ballPosition - pos);
    float distanceToBonus = length(u_bonusPos - pos);

    float ballDistortion = sin(distanceToBall * 15.0 - u_time) * (max(15.0 - distanceToBall, 0.0) / 15.0);

    float waveAmplitude = 3.0; // Amplitude maximale de la vague
    float waveSpeed = 5.0; // Vitesse de la vague
    float waveRadius = 25.0; // Rayon de la vague
    float waveDuration = 1.0; // Durée de l'effet de vague

    float elapsedTime = u_time - u_waveStart;
    float waveDistortion = 0.0;
    if (elapsedTime >= 0.0 && elapsedTime <= waveDuration) {
        float wavePhase = sin((elapsedTime / waveDuration) * 3.14159);
        float effectiveWaveRadius = waveRadius * wavePhase;
        waveDistortion = sin(distanceToBonus * waveSpeed - elapsedTime) * (max(effectiveWaveRadius - distanceToBonus, 0.0) / effectiveWaveRadius) * waveAmplitude;
    }

    pos.xyz += ballDistortion + waveDistortion;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform vec2 u_ballScreenPosition;
uniform vec2 u_bonusScreenPosition;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;
uniform float u_waveStart;
uniform vec3 u_bonusColor;

void main() {
    vec2 aspectRatio = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 uv = (gl_FragCoord.xy / u_resolution) * aspectRatio;
    float distanceToCenter = length(uv - u_ballScreenPosition * aspectRatio);
    float alpha = smoothstep(0.02, 0.1, distanceToCenter);

    vec3 farColor = vec3(1.0, 0.0, 1.0);
    vec3 color = mix(farColor, u_color, alpha);

    // Paramètres de l'effet de vague
    float waveDuration = 1.0;
    float elapsed = u_time - u_waveStart;
    float halfDuration = waveDuration / 2.0;
    float progress = elapsed / halfDuration;
    float waveProgress = progress <= 1.0 ? progress : 2.0 - progress;

    waveProgress = clamp(waveProgress, 0.0, 1.0);

    float waveThresholdStart = waveProgress * 0.13;
    float waveThresholdEnd = waveProgress * 0.20;

    float distanceToBonus = length(uv - u_bonusScreenPosition * aspectRatio);

    // Appliquer l'effet de torus
    if (distanceToBonus > waveThresholdStart && distanceToBonus < waveThresholdEnd) {
        color = u_bonusColor;
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

const Grid = ({ ballPosition, color, width, pos, divisionsX, bonusColision, bonusColor }:
    {
        ballPosition: THREE.Vector3, color: THREE.Vector3,
        width: number, pos: THREE.Vector3, divisionsX: number,
        bonusPos?: THREE.Vector3, bonusColision?: THREE.Vector3,
        bonusColor?: string
    }) => {

    const { camera, size } = useThree();
    const shaderMaterialRef = useRef<ShaderMaterial>();
    const ballScreenPositionRef = useRef(new THREE.Vector2());
    const [trueBonusPos, setTrueBonusPos] = useState(new THREE.Vector3(0, 0, 0));
    const [time, setTime] = useState(0);
    const height = 60;
    const divisionsY = 12;
    const trueColor = () => {
        if (bonusColor === "blue") {
            return new THREE.Vector3(0, 0, 1);
        } else if (bonusColor === "green") {
            return new THREE.Vector3(0, 1, 0);
        } else {
            return new THREE.Vector3(1, 0.6471, 0);
        }
    }
    
    const geometry = useMemo(() => {
        const points = [];
        for (let i = 0; i <= divisionsX; i++) {
            let positionX = (i / divisionsX - 0.5) * width;
            for (let j = 0; j < divisionsY; j++) {
                let positionYStart = (j / divisionsY - 0.5) * height;
                let positionYEnd = ((j + 1) / divisionsY - 0.5) * height;
                points.push(new THREE.Vector3(positionX, positionYStart, 0));
                points.push(new THREE.Vector3(positionX, positionYEnd, 0));
            }
        }
        for (let j = 0; j <= divisionsY; j++) {
            let positionY = (j / divisionsY - 0.5) * height;
            for (let i = 0; i < divisionsX; i++) {
                let positionXStart = (i / divisionsX - 0.5) * width;
                let positionXEnd = ((i + 1) / divisionsX - 0.5) * width;
                points.push(new THREE.Vector3(positionXStart, positionY, 0));
                points.push(new THREE.Vector3(positionXEnd, positionY, 0));
            }
        }
        
        return new THREE.BufferGeometry().setFromPoints(points);
    }, [])

    useMemo(() => {
        shaderMaterialRef.current = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_ballScreenPosition: { value: ballPosition },
                u_resolution: { value: new THREE.Vector2(size.width, size.height) },
                u_time: { value: 0 },
                u_ballPosition: { value: ballPosition },
                u_position: { value: pos },
                u_color: { value: color },
                u_bonusPos: { value: trueBonusPos },
                u_bonusScreenPosition: { value: trueBonusPos },
                u_waveStart: { value: 0 },
                u_bonusColor: { value: trueColor() }
            },
            blending: THREE.AdditiveBlending,
        })
    }, []);

    useEffect(() => {
        if (bonusColision && shaderMaterialRef.current) {
            shaderMaterialRef.current.uniforms.u_waveStart.value = time;
            shaderMaterialRef.current.uniforms.u_bonusColor.value = trueColor();
            setTrueBonusPos(bonusColision);
        }
    }, [bonusColision?.x, bonusColision?.y]);

    useFrame(({ clock }) => {
        if (ballPosition && camera && shaderMaterialRef.current) {
            let position = new THREE.Vector4(ballPosition.x, ballPosition.y, ballPosition.z, 1);

            position.applyMatrix4(camera.matrixWorldInverse);
            position.applyMatrix4(camera.projectionMatrix);

            position.divideScalar(position.w);

            const screenPosition = new THREE.Vector2(
                (position.x + 1) / 2,
                (position.y + 1) / 2
            );

            position = new THREE.Vector4(trueBonusPos.x, trueBonusPos.y, trueBonusPos.z, 1);

            position.applyMatrix4(camera.matrixWorldInverse);
            position.applyMatrix4(camera.projectionMatrix);

            position.divideScalar(position.w);

            const bonusScreenPosition = new THREE.Vector2(
                (position.x + 1) / 2,
                (position.y + 1) / 2
            );

            const delayFactor = 0.15;
            ballScreenPositionRef.current.lerp(screenPosition, delayFactor);

            shaderMaterialRef.current.uniforms.u_ballScreenPosition.value = ballScreenPositionRef.current
            shaderMaterialRef.current.uniforms.u_resolution.value = new THREE.Vector2(size.width * 1.5, size.height * 1.5);
            shaderMaterialRef.current.uniforms.u_time.value = clock.getElapsedTime();
            setTime(clock.getElapsedTime());
            shaderMaterialRef.current.uniforms.u_ballPosition.value = ballPosition;
            shaderMaterialRef.current.uniforms.u_bonusPos.value = trueBonusPos;
            shaderMaterialRef.current.uniforms.u_bonusScreenPosition.value = bonusScreenPosition;
        }
    });


    return <lineSegments position={[0, 0, 0]} geometry={geometry} material={shaderMaterialRef.current} />;
};

export default Grid;