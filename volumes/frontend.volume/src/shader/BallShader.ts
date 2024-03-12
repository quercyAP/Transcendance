export const ballShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vNormal = normal;
        vPosition = position; // Ajoutez la position du sommet comme variable variant
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        // Calculez une pseudo-normale basée sur la position du fragment par rapport au centre de la face
        vec3 pseudoNormal = normalize(vPosition - vec3(0.2, 0.2, 1));

        // Utilisez cette pseudo-normale pour déterminer l'intensité du "glow"
        float intensity = pow(0.5 - dot(pseudoNormal, vec3(0, 0, 1.0)), 2.0);

        // Calculez la couleur finale basée sur l'intensité
        gl_FragColor = vec4(1.0, 0, 1.0, 2.0) * intensity;
    }
`,
};
