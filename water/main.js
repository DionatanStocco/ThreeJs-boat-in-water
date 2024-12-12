import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

let container, stats;
let camera, scene, renderer;
let controls, water, sun;
const boats = []; // Array para armazenar os barcos

init();

function init() {
  container = document.getElementById("container");

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  container.appendChild(renderer.domElement);

  // Scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    200000
  );
  camera.position.set(30, 30, 100);

  sun = new THREE.Vector3();

  // Water
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "texture/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  // Skybox
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = { elevation: 2, azimuth: 180 };
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const sceneEnv = new THREE.Scene();
  let renderTarget;

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    if (renderTarget !== undefined) renderTarget.dispose();
    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);
    scene.environment = renderTarget.texture;
  }

  updateSun();

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

        // Armazena o barco com suas propriedades
        boats.push({
          mesh: boatClone,
          floatingAmplitude: Math.random() * 0.5 + 0.2, // Amplitude aleatória
          floatingSpeed: Math.random() * 2 + 1, // Velocidade aleatória
        });
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

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 600.0;
  controls.update();

  // Stats
  stats = new Stats();
  container.appendChild(stats.dom);

  // GUI
  const gui = new GUI();
  const folderSky = gui.addFolder("Sky");
  folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
  folderSky.add(parameters, "azimuth", -180, 180, 0.1).onChange(updateSun);
  folderSky.open();

  const waterUniforms = water.material.uniforms;
  const folderWater = gui.addFolder("Water");
  folderWater
    .add(waterUniforms.distortionScale, "value", 0, 8, 0.1)
    .name("distortionScale");
  folderWater.add(waterUniforms.size, "value", 0.1, 10, 0.1).name("size");
  folderWater.open();

  // Resize
  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  const time = performance.now() * 0.001;

  // Atualizar a flutuação dos barcos
  boats.forEach((boat) => {
    boat.mesh.position.y =
      Math.sin(time * boat.floatingSpeed) * boat.floatingAmplitude;
  });

  render();
  stats.update();
}

function render() {
  const time = performance.now() * 0.001;
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
}

// Iniciar animação
animate();
