import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { envModelLoader, characterLoader } from '../utils/processImport.js';

// === 설정 ===
// 시각화할 여러 모델들의 설정
const MODELS = [
  {
    path: '../../assets/models/indoor.glb',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_male_standing.fbx',
    position: { x: 2, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_male_sitting.fbx',
    position: { x: 4, y: 0, z: 4 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_female_sitting.fbx',
    position: { x: 6, y: 0, z: 6 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_female_sitting2.fbx',
    position: { x: 4, y: 0, z: 6 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_female2_sitting.fbx',
    position: { x: 6, y: 0, z: 4 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_female_standing.fbx',
    position: { x: 2, y: 0, z: 4 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  },
  {
    path: '../../assets/characters/char_elderfemale_sitting.fbx',
    position: { x: 4, y: 0, z: 2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
];

// === 모델 관리 ===
const loadedModels = new Map(); // 로드된 모델들을 저장
let selectedModel = null;
let selectedModelName = '';

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

// === UI 컨트롤 패널 생성 ===
function createControlPanel() {
  const panel = document.createElement('div');
  panel.style.position = 'fixed';
  panel.style.top = '10px';
  panel.style.right = '10px';
  panel.style.width = '300px';
  panel.style.background = 'rgba(0,0,0,0.8)';
  panel.style.color = 'white';
  panel.style.padding = '15px';
  panel.style.borderRadius = '8px';
  panel.style.fontFamily = 'Arial';
  panel.style.fontSize = '14px';
  panel.style.zIndex = '1000';
  panel.style.display = 'none';

  panel.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">Model Transform</h3>
    <div id="selectedModelName" style="color: #ffff00; margin-bottom: 10px;">No model selected</div>
    
    <div style="margin-bottom: 10px;">
      <label>Position X:</label>
      <input type="range" id="posX" min="-50" max="50" step="0.1" value="0" style="width: 100%;">
      <span id="posXValue">0</span>
    </div>
    
    <div style="margin-bottom: 10px;">
      <label>Position Y:</label>
      <input type="range" id="posY" min="-50" max="50" step="0.1" value="0" style="width: 100%;">
      <span id="posYValue">0</span>
    </div>
    
    <div style="margin-bottom: 10px;">
      <label>Position Z:</label>
      <input type="range" id="posZ" min="-50" max="50" step="0.1" value="0" style="width: 100%;">
      <span id="posZValue">0</span>
    </div>
    
    <div style="margin-bottom: 10px;">
      <label>Scale:</label>
      <input type="range" id="scale" min="0.1" max="5" step="0.1" value="1" style="width: 100%;">
      <span id="scaleXValue">1</span>
    </div>
    
    <button id="copyToConsole" style="width: 100%; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Copy Config to Console</button>
    <button id="resetTransform" style="width: 100%; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 5px;">Reset Transform</button>
  `;

  document.body.appendChild(panel);
  return panel;
}

const controlPanel = createControlPanel();

// === 컨트롤 이벤트 리스너 ===
function setupControlListeners() {
  const posX = document.getElementById('posX');
  const posY = document.getElementById('posY');
  const posZ = document.getElementById('posZ');
  const scale = document.getElementById('scale');

  const updateModel = () => {
    if (!selectedModel) return;

    const newPos = {
      x: parseFloat(posX.value),
      y: parseFloat(posY.value),
      z: parseFloat(posZ.value)
    };
    const newScale = {
      x: parseFloat(scale.value),
      y: parseFloat(scale.value),
      z: parseFloat(scale.value)
    };

    selectedModel.position.set(newPos.x, newPos.y, newPos.z);
    selectedModel.scale.set(newScale.x, newScale.y, newScale.z);

    // 값 표시 업데이트
    document.getElementById('posXValue').textContent = newPos.x;
    document.getElementById('posYValue').textContent = newPos.y;
    document.getElementById('posZValue').textContent = newPos.z;
    document.getElementById('scaleXValue').textContent = newScale.x;
    document.getElementById('scaleYValue').textContent = newScale.y;
    document.getElementById('scaleZValue').textContent = newScale.z;
  };

  posX.addEventListener('input', updateModel);
  posY.addEventListener('input', updateModel);
  posZ.addEventListener('input', updateModel);
  scale.addEventListener('input', updateModel);

  // 콘솔에 설정 복사
  document.getElementById('copyToConsole').addEventListener('click', () => {
    if (!selectedModel) return;

    const config = {
      path: selectedModelName,
      position: {
        x: selectedModel.position.x,
        y: selectedModel.position.y,
        z: selectedModel.position.z
      },
      rotation: {
        x: selectedModel.rotation.x,
        y: selectedModel.rotation.y,
        z: selectedModel.rotation.z
      },
      scale: {
        x: selectedModel.scale.x,
        y: selectedModel.scale.y,
        z: selectedModel.scale.z
      }
    };

    console.log('=== Model Configuration ===');
    console.log(`Model: ${selectedModelName}`);
    console.log('Config:', JSON.stringify(config, null, 2));
    console.log('Copy this to your MODELS array:');
    console.log(JSON.stringify(config, null, 2));
  });

  // 변환 리셋
  document.getElementById('resetTransform').addEventListener('click', () => {
    if (!selectedModel) return;

    selectedModel.position.set(0, 0, 0);
    selectedModel.scale.set(1, 1, 1);
    selectedModel.rotation.set(0, 0, 0);

    posX.value = 0;
    posY.value = 0;
    posZ.value = 0;
    scale.value = 1;

    updateModel();
  });
}

setupControlListeners();

function selectModel(model, modelName) {
  selectedModel = model;
  selectedModelName = modelName;
  
  console.log(`=== Model Selected: ${modelName} ===`);
  console.log('Current transform:', {
    position: model.position,
    rotation: model.rotation,
    scale: model.scale
  });

  // 패널 표시 및 현재 값으로 업데이트
  controlPanel.style.display = 'block';
  document.getElementById('selectedModelName').textContent = `Selected: ${modelName}`;

  // 슬라이더 값 업데이트
  document.getElementById('posX').value = model.position.x;
  document.getElementById('posY').value = model.position.y;
  document.getElementById('posZ').value = model.position.z;
  document.getElementById('scale').value = model.scale.x;

  // 표시된 값 업데이트
  document.getElementById('posXValue').textContent = model.position.x.toFixed(1);
  document.getElementById('posYValue').textContent = model.position.y.toFixed(1);
  document.getElementById('posZValue').textContent = model.position.z.toFixed(1);
  document.getElementById('scaleValue').textContent = model.scale.x.toFixed(1);
}

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

function applyTransform(object, config) {
  if (config.position) {
    object.position.set(config.position.x, config.position.y, config.position.z);
  }
  if (config.rotation) {
    object.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
  }
  if (config.scale) {
    object.scale.set(config.scale.x, config.scale.y, config.scale.z);
  }
}

function loadModel(path, config = {}) {
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
        console.log(`=== GLTF/GLB Model Loaded: ${modelName} ===`);
        console.log(`=== Object Names in ${modelName} ===`);
        printObjectNames(modelRoot);
        
        // 변환 적용
        applyTransform(modelRoot, config);
        
        // 로드된 모델 저장
        loadedModels.set(modelName, modelRoot);
        
        // 모델에 클릭 가능하도록 userData 설정
        modelRoot.userData.modelName = modelName;
        modelRoot.userData.isSelectableModel = true;
      },
      null, // onProgress
      (error) => {
        console.error(`GLTF/GLB load error for ${modelName}:`, error);
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
        console.log(`=== FBX Character Loaded: ${characterName} ===`);
        console.log(`=== Object Names in ${characterName} ===`);
        printObjectNames(character);
        
        // 변환 적용
        applyTransform(character, config);
        
        // 로드된 모델 저장
        loadedModels.set(characterName, character);
        
        // 모델에 클릭 가능하도록 userData 설정
        character.userData.modelName = characterName;
        character.userData.isSelectableModel = true;
        
        // 애니메이션이 있으면 첫 번째 애니메이션 재생
        if (mixer && character.animations && character.animations.length > 0) {
          characterLoader.playAnimation(characterName, 0);
        }
      },
      null, // onProgress
      (error) => {
        console.error(`FBX load error for ${characterName}:`, error);
        console.log('시도한 경로들:', possiblePaths);
      }
    )
  } else {
    console.error('지원하지 않는 파일 형식입니다:', ext);
  }
}

// 모든 모델 로드
function loadAllModels() {
  console.log(`=== Loading ${MODELS.length} models ===`);
  MODELS.forEach((modelConfig, index) => {
    console.log(`Loading model ${index + 1}: ${modelConfig.path}`);
    loadModel(modelConfig.path, modelConfig);
  });
}

loadAllModels();

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

// === 마우스 인터랙션 ===
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
    // 이름이 없거나 선택 가능한 모델이 아니면 부모 중 찾기
    while (obj && (!obj.userData.isSelectableModel || !obj.name) && obj.parent) {
      obj = obj.parent;
    }
    if (obj && obj.userData.isSelectableModel && obj.userData.modelName) {
      hoverLabel.textContent = `${obj.userData.modelName} (Click to select)`;
      hoverLabel.style.left = event.clientX + 10 + 'px';
      hoverLabel.style.top = event.clientY + 10 + 'px';
      hoverLabel.style.display = 'block';
      return;
    }
  }
  hoverLabel.style.display = 'none';
}

function onMouseClick(event) {
  // 마우스 위치를 -1~1로 변환
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    // 선택 가능한 모델 찾기
    while (obj && !obj.userData.isSelectableModel && obj.parent) {
      obj = obj.parent;
    }
    
    if (obj && obj.userData.isSelectableModel && obj.userData.modelName) {
      const modelName = obj.userData.modelName;
      const model = loadedModels.get(modelName);
      if (model) {
        selectModel(model, modelName);
      }
    }
  }
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);

// === 키보드 단축키 ===
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    // ESC로 선택 해제
    selectedModel = null;
    selectedModelName = '';
    controlPanel.style.display = 'none';
    console.log('Model selection cleared');
  }
});

