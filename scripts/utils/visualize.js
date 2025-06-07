import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { envModelLoader, characterLoader } from '../utils/processImport.js';

// === 설정 ===
// 시각화할 파일 경로 (glb 또는 fbx 중 하나만)
const MODEL_PATH = '../../assets/char_female_sitting.fbx'; // 예시: '../assets/indoor.glb' 또는 '../assets/outdoor.fbx'

// === 기본 THREE.js 세팅 ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 0.5;
controls.maxDistance = 1000;
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
    // 파일명에서 모델 이름 추출 (확장자 제거)
    const modelName = path.split('/').pop().split('.')[0];
    const fileExtension = path.split('.').pop();
    
    // 여러 가능한 경로 시도
    const possiblePaths = [
      path,                                           // 원본 경로
      `../../assets/${modelName}.${fileExtension}`,   // utils에서 assets로
      `../assets/${modelName}.${fileExtension}`,      // scripts에서 assets로
      `./assets/${modelName}.${fileExtension}`,       // 현재 디렉토리에서 assets로
      `assets/${modelName}.${fileExtension}`          // 상대 경로
    ];
    
    envModelLoader.loadEnvironmentModel(
      modelName,
      possiblePaths,
      scene,
      (modelRoot) => {
        console.log('=== GLTF/GLB Model Loaded ===');
        console.log('=== Object Names in GLTF/GLB ===');
        printObjectNames(modelRoot);
      },
      null, // onProgress
      (error) => {
        console.error('GLTF/GLB load error:', error);
        console.log('시도한 경로들:', possiblePaths);
      }
    );
  } else if (ext === 'fbx') {
    // 파일명에서 캐릭터 이름 추출 (확장자 제거)
    const characterName = path.split('/').pop().split('.')[0];
    
    // 여러 가능한 경로 시도
    const possiblePaths = [
      path,                                    // 원본 경로
      `../../assets/${characterName}.fbx`,     // utils에서 assets로
      `../assets/${characterName}.fbx`,        // scripts에서 assets로
      `./assets/${characterName}.fbx`,         // 현재 디렉토리에서 assets로
      `assets/${characterName}.fbx`            // 상대 경로
    ];
    
    characterLoader.loadCharacter(
      characterName,
      possiblePaths,
      scene,
      false, // dummy
      (character, mixer) => {
        console.log('=== FBX Character Loaded ===');
        console.log('=== Object Names in FBX ===');
        printObjectNames(character);
        
        // 애니메이션이 있으면 첫 번째 애니메이션 재생
        if (mixer && character.animations && character.animations.length > 0) {
          characterLoader.playAnimation(characterName, 0);
        }
      },
      null, // onProgress
      (error) => {
        console.error('FBX load error:', error);
        console.log('시도한 경로들:', possiblePaths);
      }
    )
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
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  
  // 캐릭터 애니메이션 업데이트
  characterLoader.updateAllAnimations(deltaTime);
  
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

