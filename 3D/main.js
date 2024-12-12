import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js"; // Importa OrbitControls

// Cena
const scene = new THREE.Scene();

// Câmera
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  1,
  2000
);
camera.position.set(0, 50, 500); // Ajuste a posição inicial da câmera para uma visão ampla da cena

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x789bdb); // Define a cor de fundo
document.body.appendChild(renderer.domElement);

// Adicionando luzes à cena
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Luz ambiente
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Luz direcional
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);

// Carregar o arquivo GLB
const gltfLoader = new GLTFLoader();
gltfLoader.load(
  "./texture/boat.glb", // Caminho para o arquivo GLB
  function (gltf) {
    const model = gltf.scene;

    // Função para clonar e adicionar modelos à cena
    function addBoat(x, z, rotationY = 0, scale = 1) {
      const boatClone = model.clone(); // Clona o modelo original
      boatClone.position.set(x, 0, z); // Define a posição
      boatClone.rotation.y = rotationY; // Define a rotação no eixo Y
      boatClone.scale.set(scale, scale, scale); // Ajusta a escala se necessário
      scene.add(boatClone); // Adiciona o clone à cena
    }

    // Definindo a distância entre os barcos
    const distance = 100;

    // Adicionando 10 barcos lado a lado
    for (let i = 0; i < 10; i++) {
      const xPosition = i * distance; // Define a posição X para cada barco
      addBoat(xPosition, 0, Math.PI / 2); // Gira os barcos 90 graus no eixo Y
    }
  },
  undefined,
  function (error) {
    console.error("Erro ao carregar o modelo:", error);
  }
);

// Adicionando OrbitControls com configurações ajustadas
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Ativa a suavização dos movimentos
controls.dampingFactor = 0.25; // Fator de suavização
controls.screenSpacePanning = true; // Permite o movimento lateral da câmera
controls.minDistance = 50; // Distância mínima
controls.maxDistance = 2000; // Distância máxima
controls.target.set(500, 0, 0); // Ajusta o ponto de foco para o centro da cena (ajuste conforme necessário)

// Função de animação
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Atualiza os controles
  renderer.render(scene, camera);
}

// Ajuste de redimensionamento da janela
window.addEventListener("resize", function () {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Iniciar animação
animate();
