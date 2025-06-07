import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// === 설정 ===
// 시각화할 파일 경로 (glb 또는 fbx 중 하나만)
const MODEL_PATH = '../assets/indoor.glb'; // 예시: '../assets/indoor.glb' 또는 '../assets/outdoor.fbx'

// === 기본 THREE.js 세팅 ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0.5;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2;

// 조명
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight1.position.set(5, 10, 7);
scene.add(dirLight1);
const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight2.position.set(-5, 10, -7);
scene.add(dirLight2);
const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight3.position.set(0, 10, -10);
scene.add(dirLight3);

// === 모델 로딩 ===
function printObjectNames(object, prefix = '') {
  // 현재 오브젝트 이름 출력
  if (object.name) {
    console.log(prefix + object.name);
  }
  // 자식 오브젝트 재귀적으로 출력
  if (object.children && object.children.length > 0) {
    object.children.forEach(child => printObjectNames(child, prefix + '  '));
  }
}

function loadModel(path) {
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'glb' || ext === 'gltf') {
    const loader = new GLTFLoader();
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        console.log('=== Object Names in GLB ===');
        printObjectNames(model);
      },
      undefined,
      (error) => {
        console.error('GLB load error:', error);
      }
    );
  } else if (ext === 'fbx') {
    const loader = new FBXLoader();
    loader.load(
      path,
      (object) => {
        scene.add(object);
        console.log('=== Object Names in FBX ===');
        printObjectNames(object);
      },
      undefined,
      (error) => {
        console.error('FBX load error:', error);
      }
    );
  } else {
    console.error('지원하지 않는 파일 형식입니다:', ext);
  }
}

loadModel(MODEL_PATH);

// === 리사이즈 대응 ===
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// === 애니메이션 루프 ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// === Hover Label Setup ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const hoverLabel = document.createElement('div');
hoverLabel.style.position = 'fixed';
hoverLabel.style.pointerEvents = 'none';
hoverLabel.style.background = 'rgba(0,0,0,0.8)';
hoverLabel.style.color = 'white';
hoverLabel.style.padding = '2px 8px';
hoverLabel.style.borderRadius = '4px';
hoverLabel.style.fontSize = '13px';
hoverLabel.style.fontFamily = 'Arial';
hoverLabel.style.zIndex = '1000';
hoverLabel.style.display = 'none';
document.body.appendChild(hoverLabel);

function onMouseMove(event) {
  // 마우스 위치를 -1~1로 변환
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  // 씬의 모든 오브젝트와 교차 검사
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    // 가장 가까운 오브젝트의 이름 표시
    let obj = intersects[0].object;
    // 이름이 없으면 부모 중 이름 있는 것 찾기
    while (obj && !obj.name && obj.parent) obj = obj.parent;
    if (obj && obj.name) {
      hoverLabel.textContent = obj.name;
      hoverLabel.style.left = event.clientX + 10 + 'px';
      hoverLabel.style.top = event.clientY + 10 + 'px';
      hoverLabel.style.display = 'block';
      return;
    }
  }
  hoverLabel.style.display = 'none';
}

window.addEventListener('mousemove', onMouseMove);
