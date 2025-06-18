// ResultBroadcastScene.js
import * as THREE from 'three';
import { envModelLoader } from '../utils/processImport.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Candidate from '../utils/Candidate.js';

import ProgressResultRenderer from '../utils/ProgressResultRenderer.js';
import BarUtil from '../utils/bar.js';

export default class SceneHome {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();

    // Animation clock for candidate mixers
    this.clock = new THREE.Clock();

    // 초기화 상태 추적
    this.initialized = false;

    // 무거운 객체들을 나중에 생성
    this.mixer = null;
    this.labelRenderer = null;
    this.textOverlay = null;
    this.bedroomModel = null;
    // Glow 효과 객체들
    this.phoneGlow = null;
    this.tvGlow = null;
    // 가벼운 상태 변수들만 초기화
    this.manualStartPosition = null;
    this.shouldRespawn = false;
    this.assetsLoaded = false;
    this.tvBroadcastStarted = false;

    // 이동 조작 변수들 (가벼움)
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canLook = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.cameraYaw = 0;
    this.cameraPitch = 0;

    // 방 정보 (나중에 설정)
    this.roomInfo = null;

    // 후보자 배열 선언
    this.candidates = [];

    // tap-and-progress logic
    this.keyPressCount = 0;
    this.timeLimit = 5000; // milliseconds
    this.requiredCount = 10;
    this.hasHandledResult = false;
    this._handleKeyTap = (e) => {
      if (e.code === 'Space') {
        this.keyPressCount++;
        console.log('🔘 Space pressed, count =', this.keyPressCount);
      }
    };

    // 이벤트 리스너 함수들 미리 바인딩 (가벼운 작업)
    this._setupControlFunctions();

    // Space 키 이벤트 리스너 정의
    this.onSpaceKeyDown = (event) => {
      if (event.code === 'Space') {
        if (this.internalCandidate) {
          this.internalCandidate.playNextHitAnimation();
        }
        this.candidates.forEach(candidate => {
          candidate.playNextHitAnimation();
        });
        console.log('▶️ 모든 후보자 애니메이션 재생');
      }
    };

    // Progress/results WebGLRenderTarget renderer
    this.prRenderer = new ProgressResultRenderer(this.renderer, 512, 256);

    this.barUtil = new BarUtil(this.renderer, 512, 256);

    console.log('ResultBroadcastScene constructor completed (lightweight)');
  }

  // 무거운 초기화 작업들 (onEnter에서만 실행)
  _init() {
    console.log('🏠 ResultBroadcastScene 무거운 초기화 시작...');
    
    THREE.ColorManagement.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 1) CSS2DRenderer 생성 (무거운 작업)
    this._createLabelRenderer();

    // 2) 배경 설정
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // 3) 기본 조명 설정
    this._setupBasicLighting();
    
    // 4) 텍스트 오버레이 생성 (DOM 조작)
    this._createTextOverlay();
    
    // 5) 3D 모델 로딩 (가장 무거운 작업)
    this._loadBedroomModel();
    
    console.log('✅ ResultBroadcastScene 초기화 완료');
  }


  _createLabelRenderer() {
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.width = '100%';
    this.labelRenderer.domElement.style.height = '100%';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.style.zIndex = '1000';
    document.body.appendChild(this.labelRenderer.domElement);
    
    console.log('📱 CSS2DRenderer 생성 완료');
  }

  _loadBedroomModel() {
    console.log('🏠 침실 모델 로딩 시작...');
    
    envModelLoader.loadEnvironmentModel(
      'bedroom',
      ['./assets/models/new-bedroom.glb'],
      this.scene,
      (modelRoot) => {
        // 로딩 성공 시 호출되는 콜백
        this.bedroomModel = modelRoot;
        this._afterLoad();
        console.log('✅ 침실 모델 로딩 완료');
      },
      undefined,
      (err) => {
        console.error('❌ 침실 모델 로딩 실패:', err);
      }
    );
  }

  _afterLoad() {
    // 디버그용으로 맵 정보 출력
    this.bedroomModel.traverse(child => {
      if (child.isMesh) {
        console.log(
          `[DBG] Mesh "${child.name}" → map:`,
          child.material.map,
          ', emissiveMap:',
          child.material.emissiveMap
        );
      }
    });

    // TV 비디오 추가
    this._setupTVVideoOverlay();

    // sRGB 인코딩 강제 설정
    this.bedroomModel.traverse(child => {
      if (child.isMesh && child.material.map) {
        child.material.map.encoding = THREE.sRGBEncoding;
        child.material.needsUpdate = true;
      }
    });

    // 기존 환경 셋업 호출
    this._adjustEnvironmentForAsset();
    this._autoPositionCameraInside();
    this.assetsLoaded = true;
  }
  // TV 화면 4개 꼭짓점 좌표로 정확한 렌더타겟 화면 생성
  _setupTVVideoOverlay() {
    console.log('📺 정확한 TV 좌표로 렌더타겟 화면 생성...');

    const corners = {
      bottomLeft:  { x: 117.75, y: 35, z: 315.13 },
      bottomRight: { x: 197.69, y: 35, z: 314.83 },
      topLeft:     { x: 117.75, y: 80, z: 315.13 },
      topRight:    { x: 197.69, y: 80, z: 314.83 }
    };

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      corners.bottomLeft.x,  corners.bottomLeft.y,  corners.bottomLeft.z,
      corners.bottomRight.x, corners.bottomRight.y, corners.bottomRight.z,
      corners.topLeft.x,     corners.topLeft.y,     corners.topLeft.z,
      corners.bottomRight.x, corners.bottomRight.y, corners.bottomRight.z,
      corners.topRight.x,    corners.topRight.y,    corners.topRight.z,
      corners.topLeft.x,     corners.topLeft.y,     corners.topLeft.z
    ]);

    const uvs = new Float32Array([
      0, 0,  1, 0,  0, 1,
      1, 0,  1, 1,  0, 1
    ]);

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const screenMesh = new THREE.Mesh(geometry, blackMaterial); // Ensure black material assigned initially
    this.scene.add(screenMesh);
    // TV 글로우 효과 생성
    const tvGlowRadius = 5;
    const tvGlowGeom = new THREE.SphereGeometry(tvGlowRadius, 16, 16);
    const tvGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.2
    });
    this.tvGlow = new THREE.Mesh(tvGlowGeom, tvGlowMat);
    // Store base scale for pulsing
    this.tvGlow.userData.baseScale = tvGlowRadius;
    // compute center of TV screen plane and position glow there
    const tvCenter = new THREE.Vector3();
    geometry.computeBoundingBox();
    geometry.boundingBox.getCenter(tvCenter);
    this.tvGlow.position.copy(tvCenter);
    // ensure glow renders on top
    this.tvGlow.renderOrder = 1001;
    this.tvGlow.material.depthTest = false;
    this.scene.add(this.tvGlow);
    console.log('🐉 TV Glow created with renderOrder:', this.tvGlow.renderOrder, 'depthTest:', this.tvGlow.material.depthTest, 'position:', this.tvGlow.position);

    // Create an overlay mesh matching the TV screen plane
    const overlayGeom = geometry.clone();
    const overlayMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0
    });
    const overlayMesh = new THREE.Mesh(overlayGeom, overlayMat);
    // Always render overlay on top
    overlayMesh.renderOrder = 999;
    overlayMesh.material.depthTest = false;
    // Match transform of the TV screen
    overlayMesh.position.copy(screenMesh.position);
    overlayMesh.rotation.copy(screenMesh.rotation);
    overlayMesh.scale.copy(screenMesh.scale);
    // Add to scene and use for bar parenting
    this.scene.add(overlayMesh);
    this.overlayPlane = overlayMesh;


    // 내부 렌더타겟 준비
    const rtWidth = 512;
    const rtHeight = 512;
    const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
    const rtCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    rtCamera.position.set(0, 0, 5);
    const rtScene = new THREE.Scene();

    // 내부 객체들 (후보자 3D 모델)
    const rtLight = new THREE.AmbientLight(0xffffff, 1);
    rtScene.add(rtLight);

    Candidate.loadFromGLB('assets/models/three_candidates.glb').then((candidateModel) => {
      candidateModel.setPosition(new THREE.Vector3(0, -1, 0));
      candidateModel.model.scale.set(0.6, 0.75, 0.6); // Increase Y (height) scale to 0.75
      candidateModel.addToScene(rtScene);

      // --- 후보자 이름 라벨 Sprite 추가 ---
      // 이름/오프셋 배열
      const nameLabels = [
        { text: '김후보', offsetX: -1 },
        { text: '이후보', offsetX: 0 },
        { text: '박후보', offsetX: 1 }
      ];
      const headY = 0.5; // 머리 위 쯤의 높이
      nameLabels.forEach(({ text, offsetX }) => {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        // 배경 투명, 텍스트 흰색+검정 테두리
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 40px Malgun Gothic, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 테두리(검정)
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#222';
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
        // 본문(흰색)
        ctx.fillStyle = '#fff';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        // Texture/Sprite 생성
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(offsetX, headY, 0);
        sprite.scale.set(1.5, 0.4, 1);
        rtScene.add(sprite);
      });

      this.internalCandidate = candidateModel;
    }).catch(err => {
      console.error('❌ 후보자 모델 로딩 실패:', err);
    });

    this.internalScene = rtScene;
    this.internalCamera = rtCamera;
    this.internalRenderTarget = renderTarget;
    this.tvRenderTargetMaterial = new THREE.MeshBasicMaterial({
      map: renderTarget.texture,
      side: THREE.DoubleSide
    });

    // --- Use progress/result renderer for the TV screen ---
    // use progress renderer texture initially
    screenMesh.material = new THREE.MeshBasicMaterial({
      map: this.prRenderer.renderToTexture(),
      side: THREE.DoubleSide
    });

    // --- TV interaction logic ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onTVClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(screenMesh);
      if (intersects.length > 0 && !this.tvBroadcastStarted) {
        // Require user to be within interaction distance to click the TV
        const hitPoint = intersects[0].point;
        const distanceToTV = this.camera.position.distanceTo(hitPoint);
        const maxDistance = 100; // maximum allowed distance to interact
        if (distanceToTV > maxDistance) {
          console.log(`📏 TV too far: ${distanceToTV.toFixed(2)} > ${maxDistance}`);
          return;
        }
        console.log('🖱 TV clicked, revealing overlay.');
        // Only assign the render target material if TV hasn't started yet
        screenMesh.material = this.tvRenderTargetMaterial;
        this.tvBroadcastStarted = true;
        // Reset timer and tap count from click moment
        this.startTime = performance.now();
        this.keyPressCount = 0;
        // initialize bar overlay when TV is clicked
        this._setupTVbarOverlay();
        // TV 클릭 시 글로우 제거
        if (this.tvGlow) {
          this.scene.remove(this.tvGlow);
          this.tvGlow = null;
        }
        // No overlay UI needed; progress/result handled by prRenderer
        console.log('📺 TV 화면 → 개표 장면 전환 시작');
      }
      // If TV already started, do NOT overwrite the material
    };
    window.addEventListener('click', onTVClick);

    this.tvScreenMesh = screenMesh;

  }
  // TV bar 화면 4개 꼭짓점 좌표로 정확한 바 화면 생성
  _setupTVbarOverlay() {
    console.log('📺 정확한 TV bar 좌표로 bar 생성...');

    // TV 화면 4개 꼭짓점 좌표
    const corners_bar = {
      bottomLeft:  { x: 117.75, y: 85, z: 315.13 },
      bottomRight: { x: 197.69, y: 85, z: 314.83 },
      topLeft:     { x: 117.75, y: 100, z: 315.13 },
      topRight:    { x: 197.69, y: 100, z: 314.83 }
    };

    // Geometry 생성
    const geometry_bar = new THREE.BufferGeometry();
    const vertices_bar = new Float32Array([
      corners_bar.bottomLeft.x,  corners_bar.bottomLeft.y,  corners_bar.bottomLeft.z,
      corners_bar.bottomRight.x, corners_bar.bottomRight.y, corners_bar.bottomRight.z,
      corners_bar.topLeft.x,     corners_bar.topLeft.y,     corners_bar.topLeft.z,
      corners_bar.bottomRight.x, corners_bar.bottomRight.y, corners_bar.bottomRight.z,
      corners_bar.topRight.x,    corners_bar.topRight.y,    corners_bar.topRight.z,
      corners_bar.topLeft.x,     corners_bar.topLeft.y,     corners_bar.topLeft.z
    ]);
    const uvs_bar = new Float32Array([
      0, 0,  1, 0,  0, 1,
      1, 0,  1, 1,  0, 1
    ]);
    geometry_bar.setAttribute('position', new THREE.BufferAttribute(vertices_bar, 3));
    geometry_bar.setAttribute('uv',       new THREE.BufferAttribute(uvs_bar, 2));
    geometry_bar.computeVertexNormals();

    // 메시 생성 및 BarUtil 초기화
    const barOverlayMesh = new THREE.Mesh(
      geometry_bar,
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    this.barUtil.init(barOverlayMesh);

    // 화면 위에 렌더링되도록 설정
    barOverlayMesh.renderOrder = 1000;
    barOverlayMesh.material.depthTest = false;

    this.scene.add(barOverlayMesh);
    this.barOverlayMesh = barOverlayMesh;
  }
  
  // 🎵 TV 화면 클릭 감지 함수 (이전 비디오용, 렌더타겟 버전에서는 미사용)

  _optimizeLoadedAsset() {
    if (!this.bedroomModel) return;
    
    // 그림자 설정
    this.bedroomModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 머티리얼 최적화
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.needsUpdate = true;
            });
          } else {
            child.material.needsUpdate = true;
          }
        }
      }
    });
    
    console.log('✅ 에셋 최적화 완료');
  }

  _adjustEnvironmentForAsset() {
    // 기존 조명 제거
    const lightsToRemove = [];
    this.scene.traverse((child) => {
      if (child.isLight) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach(light => this.scene.remove(light));
    
    // 훨씬 더 밝은 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    
    // 추가 보조광
    const fillLight1 = new THREE.PointLight(0xffffff, 0.8, 20);
    fillLight1.position.set(-5, 5, 5);
    this.scene.add(fillLight1);
    
    const fillLight2 = new THREE.PointLight(0xffffff, 0.8, 20);
    fillLight2.position.set(5, 5, -5);
    this.scene.add(fillLight2);
    
    // 환경광
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemi);

    // 배경색
    this.scene.background = new THREE.Color(0xffffff);
    
    console.log('✅ 환경 조명 설정 완료');
  }

  // 방 내부에 카메라 자동 배치
  _autoPositionCameraInside() {
    // 1) 메시만 모아서 정제된 바운딩박스 계산
    const box = new THREE.Box3();
    this.bedroomModel.traverse(child => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const geomBox = child.geometry.boundingBox.clone();
        geomBox.applyMatrix4(child.matrixWorld);
        box.union(geomBox);
      }
    });

    // 2) 박스에서 중심(center)과 크기(size) 구하기
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    console.log('🏠 정제된 방 바운딩:', box.min, box.max);

    // 3) 수동 시작 위치로 덮어쓰기
    const manualStart = new THREE.Vector3(104.98, 50, 499.92);
    this.camera.position.copy(manualStart);
    this.camera.lookAt(104.98, 50, 400);
    this.cameraYaw = 0;
    this.cameraPitch = 0;

    // 4) roomInfo 갱신
    this.roomInfo = { center, size, box };

    console.log('📷 수동 카메라 위치:', manualStart);
  }

  _setupBasicLighting() {
    // 로딩 중 최소한의 조명
    const tempLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(tempLight);
  }

  _createTextOverlay() {
    this.textOverlay = document.createElement('div');
    this.textOverlay.id = 'home-text';
    Object.assign(this.textOverlay.style, {
      position: 'absolute',
      top: '10%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
      opacity: '0',
      transition: 'opacity 1.5s ease-in-out',
      zIndex: '1000',
      fontFamily: 'Malgun Gothic, sans-serif',
      background: 'rgba(0,0,0,0.6)',
      padding: '20px 30px',
      borderRadius: '10px',
      backdropFilter: 'blur(5px)'
    });
    this.textOverlay.innerHTML = `
      🏠 이제 곧 개표가 시작된다. TV 앞으로 가볼까?<br/>
      <div style="font-size: 16px; margin-top: 15px; color: #ccc;">
        📺️ TV 클릭해서 개표방송 보기 <br/>
        <span style="color: #ffcc00;">⏳ Space 키로 당신의 후보를 당선시켜보자</span><br/>
        🎮 WASD로 이동 + 우클릭 드래그로 시점 변경
      </div>
    `;
    
    console.log('📝 텍스트 오버레이 생성 완료');
  }

  // onEnter에서 무거운 초기화 실행
  onEnter() {
    console.log('ResultBroadcastScene onEnter');

    // 한 번만 초기화
    if (!this.initialized) {
      this._init();
      this.initialized = true;
    }

    // 1) 초기 로딩 전 기본 위치 세팅
    if (!this.assetsLoaded) {
      this.camera.position.set(0, 2, 8);
      this.camera.rotation.set(0, 0, 0);
      this.camera.lookAt(0, 1, 0);
      this.camera.updateProjectionMatrix();
    }
    this.cameraYaw = 0;
    this.cameraPitch = 0;

    // reset tap-and-progress
    this.keyPressCount = 0;
    this.hasHandledResult = false;
    window.addEventListener('keydown', this._handleKeyTap);

    // Reset progress bars
    if (this.tvScreenMesh) {
      this.prRenderer.updateProgress(0, 0);
      this.tvScreenMesh.material.map = this.prRenderer.renderToTexture();
    }

    // 2) 조작 이벤트 등록, UI 추가 등
    this._setupControls();
    if (this.textOverlay) {
      document.body.appendChild(this.textOverlay);
    }

    // 3) 에셋 로딩 완료 후 강제 수동 위치 재적용
    const startScene = () => {
      if (this.assetsLoaded) {
        console.log('📷 방 내부 카메라 배치 완료 (자동 & 수동 적용)');
        // 수동 좌표로 재세팅
        this.camera.position.set(104.98, 50, 499.92);
        this.camera.lookAt(104.98, 50, 400);
        console.log('📷 startScene: 수동 카메라 위치 재세팅:', this.camera.position);

        // 텍스트 페이드인/out 등
        this.textOverlay.style.opacity = '1';
        setTimeout(() => this.textOverlay.style.opacity = '0', 5000);
      } else {
        setTimeout(startScene, 100);
      }
    };
    startScene();
  }

  // 기존 구조에 맞춘 onExit 메서드
  onExit() {
    console.log('ResultBroadcastScene onExit');

    window.removeEventListener('keydown', this._handleKeyTap);
    // UI 제거
    if (this.textOverlay && this.textOverlay.parentNode) {
      this.textOverlay.parentNode.removeChild(this.textOverlay);
    }
    // Remove TV overlay mesh and canvas mesh (no longer used)
    if (this.tvOverlayMesh) this.scene.remove(this.tvOverlayMesh);
    if (this.canvasMesh) this.scene.remove(this.canvasMesh);
    // 이동 조작 이벤트 제거
    this._removeControls();
    /*
    const ui = document.getElementById('result-ui');
    if (ui) {
      ui.remove();
    }
    */
  }

  // 이벤트 리스너 함수들 미리 정의 (가벼운 작업)
  _setupControlFunctions() {
    // 키보드 이벤트
    this.onKeyDown = (event) => {
      switch(event.code) {
        case 'KeyW': case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS': case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA': case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD': case 'ArrowRight':
          this.moveRight = true;
          break;
      }
    };
    
    this.onKeyUp = (event) => {
      switch(event.code) {
        case 'KeyW': case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS': case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA': case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD': case 'ArrowRight':
          this.moveRight = false;
          break;
      }
    };
    
    // 마우스 이벤트 (우클릭으로 시점 변경)
    this.onMouseDown = (event) => {
      if (event.button === 2) { // 우클릭
        this.canLook = true;
        this.prevMouseX = event.clientX;
        this.prevMouseY = event.clientY;
        document.body.style.cursor = 'grab';
      }
    };
    
    this.onMouseUp = (event) => {
      if (event.button === 2) {
        this.canLook = false;
        document.body.style.cursor = 'default';
      }
    };
    
    this.onMouseMove = (event) => {
      if (this.canLook) {
        const deltaX = event.clientX - this.prevMouseX;
        const deltaY = event.clientY - this.prevMouseY;
        
        // yaw/pitch 변수로 회전 관리
        this.cameraYaw -= deltaX * 0.002;
        this.cameraPitch -= deltaY * 0.002;
        
        // 상하 시점 제한
        this.cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraPitch));
        
        // 카메라 회전 적용
        this._updateCameraRotation();
        
        this.prevMouseX = event.clientX;
        this.prevMouseY = event.clientY;
      }
    };
    
  }


  // 이동 조작 설정
  _setupControls() {
    // 이벤트 등록
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    // 우클릭 메뉴 비활성화
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    // Space 키 이벤트 리스너 등록
    document.addEventListener('keydown', this.onSpaceKeyDown);
  }

  _removeControls() {
    // Space 키 이벤트 리스너 제거
    document.removeEventListener('keydown', this.onSpaceKeyDown);
    if (this.onKeyDown) {
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousedown', this.onMouseDown);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('mousemove', this.onMouseMove);
    }
    document.body.style.cursor = 'default';
  }

  // 기존 update, render, 기타 메서드들은 모두 동일...
  update() {
    // 이동 처리
    this._handleMovement();

    // 에셋이 로드된 경우에만 업데이트
    if (this.assetsLoaded && this.bedroomModel) {
      const time = Date.now() * 0.001;

      // 조명 미세 조정
      this.scene.traverse((child) => {
        if (child.type === 'PointLight') {
          const baseIntensity = child.userData.baseIntensity || child.intensity;
          child.userData.baseIntensity = baseIntensity;
          child.intensity = baseIntensity + Math.sin(time * 1.5) * 0.05;
        }
      });

      // TV 방송이 시작된 경우 내부 렌더타겟 씬을 렌더 및 애니메이션 업데이트
      if (this.tvBroadcastStarted && this.internalScene && this.internalCamera && this.internalRenderTarget) {
        const delta = this.clock.getDelta();

        if (this.internalCandidate?.mixer) {
          this.internalCandidate.mixer.update(delta);
        }

        this.renderer.setRenderTarget(this.internalRenderTarget);
        this.renderer.render(this.internalScene, this.internalCamera);
        this.renderer.setRenderTarget(null);

        // update 3D world-space bars
        const elapsed = performance.now() - this.startTime;
        const timeRatio = Math.min(1, elapsed / this.timeLimit);
        const tapRatio = Math.min(1, this.keyPressCount / this.requiredCount);
        // Update bar overlay via BarUtil
        this.barUtil.update(tapRatio, timeRatio);

        // (optional) Remove or comment out prRenderer.updateProgress and renderToTexture calls:
        // if (this.tvScreenMesh) {
        //   this.prRenderer.updateProgress(tapRatio, timeRatio);
        //   this.tvScreenMesh.material.map = this.prRenderer.renderToTexture();
        // }

        // handle result once
        if (!this.hasHandledResult) {
          if (tapRatio >= 1) {
            this.hasHandledResult = true;
            this.prRenderer.showResult(true);
            if (this.tvScreenMesh) {
              this.tvScreenMesh.material.map = this.prRenderer.renderToTexture();
              this.tvScreenMesh.material.needsUpdate = true;
            }
            // 성공 시 2초 후 EndingScene으로 전환
            setTimeout(() => {
              this.sceneManager.transitionTo('ending');
            }, 2000);
          } else if (elapsed >= this.timeLimit) {
            this.hasHandledResult = true;
            this.prRenderer.showResult(false);
            if (this.tvScreenMesh) {
              this.tvScreenMesh.material.map = this.prRenderer.renderToTexture();
              this.tvScreenMesh.material.needsUpdate = true;
            }
            // after failure result display, transition to ending after 2 seconds
            setTimeout(() => {
              this.sceneManager.transitionTo('ending');
            }, 2000);
          }
        }
      }
      // (phone glow 효과 제거)
    }
    // Update animation mixers for candidates
    if (this.candidates && this.candidates.length > 0) {
      const delta = this.clock.getDelta();
      this.candidates.forEach(c => c.mixer && c.mixer.update(delta));
    }
  }

  _handleMovement() {
    const moveSpeed = 0.5;
    
    // 카메라의 현재 회전에 따른 방향 벡터 계산
    const forward = new THREE.Vector3(
      -Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw)
    ).normalize();
    
    const right = new THREE.Vector3(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw)
    ).normalize();
    
    // 이동 처리
    const movement = new THREE.Vector3(0, 0, 0);
    let moved = false;
    
    if (this.moveForward) {
      movement.add(forward.clone().multiplyScalar(moveSpeed));
      moved = true;
    }
    if (this.moveBackward) {
      movement.add(forward.clone().multiplyScalar(-moveSpeed));
      moved = true;
    }
    if (this.moveLeft) {
      movement.add(right.clone().multiplyScalar(-moveSpeed));
      moved = true;
    }
    if (this.moveRight) {
      movement.add(right.clone().multiplyScalar(moveSpeed));
      moved = true;
    }
    
    // 카메라 위치 업데이트
    if (moved) {
      this.camera.position.add(movement);
      
      // 이동할 때마다 위치 출력 (디버깅용)
      if (Date.now() % 500 < 16) {
        console.log('🚶 현재 위치:', {
          x: Math.round(this.camera.position.x * 100) / 100,
          y: Math.round(this.camera.position.y * 100) / 100,
          z: Math.round(this.camera.position.z * 100) / 100
        });
      }
    }
  }

  // 카메라 회전 업데이트
  _updateCameraRotation() {
    // yaw와 pitch를 사용해서 카메라가 바라볼 방향 계산
    const lookDirection = new THREE.Vector3(
      -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    );
    
    // 카메라가 바라볼 타겟 위치 계산
    const target = this.camera.position.clone().add(lookDirection);
    
    // lookAt으로 카메라 방향 설정
    this.camera.lookAt(target);
  }


  // 렌더링
  render() {
    // Pulse TV glow if present
    if (this.tvGlow) {
      const t = Date.now() * 0.005;
      const base = this.tvGlow.userData.baseScale || 10;
      const scale = base * (1 + Math.sin(t) * 0.3);
      this.tvGlow.scale.setScalar(scale);
      this.tvGlow.material.opacity = 0.2 + Math.sin(t * 2) * 0.1;
    }
    console.log('🌓 render() called, tvGlow exists:', !!this.tvGlow);
    // 배경색 설정 등
    this.renderer.setClearColor(this.assetsLoaded ? 0xf8f8f8 : 0x1a1a1a);
    
    // CSS2DRenderer 처리
    if (this.labelRenderer) {
      // Warning UI 상태 확인
      const hasWarningUI = this.warningUI && 
                          this.warningUI.element && 
                          this.warningUI.element.style.display !== 'none';
      
      if (hasWarningUI) {
        this.labelRenderer.domElement.style.pointerEvents = 'auto';
      } else {
        this.labelRenderer.domElement.style.pointerEvents = 'none';
      }
      
      this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
      this.labelRenderer.render(this.scene, this.camera);
    }
  }

  // 메모리 정리
  dispose() {
    // CSS2DRenderer 정리
    if (this.labelRenderer && this.labelRenderer.domElement.parentNode) {
      this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement);
    }
    
    // UI 요소들 정리
    if (this.textOverlay && this.textOverlay.parentNode) {
      this.textOverlay.parentNode.removeChild(this.textOverlay);
    }
    
    // Three.js 객체들 정리
    if (this.scene) {
      this.scene.clear();
    }
    
    console.log('ResultBroadcastScene disposed');
  }

  // 3D 위에 HTML 패널 띄우기
  _showPhoneUI() {
    if (!this.phoneUI) {
      const container = document.createElement('div');
      Object.assign(container.style, {
        width: '500px', height: '650px', padding: '15px', 
        background: 'rgba(255,255,255,0.95)',
        color: '#222', pointerEvents: 'auto', borderRadius: '15px', 
        fontFamily: 'Malgun Gothic, sans-serif',
        fontSize: '16px', boxShadow: '0 12px 24px rgba(0,0,0,0.4)', 
        overflow: 'hidden', zIndex: '1000',
        border: '2px solid #ddd'
      });
      container.style.display = 'flex';
      container.style.gap = '16px';
      
      container.innerHTML = `
        <!-- 좌측 패널 -->
        <div id="left-panel" style="
            flex:2; display:flex; flex-direction:column;
            padding:12px; overflow:auto;
            background: #f8f9fa; border-radius: 8px;
          ">
          <h2 style="margin-top:0; font-size:20px; color:#2c3e50;">📱 투표 정보 확인</h2>
          <div id="candidate-list">
            <h3 style="font-size:18px; color:#34495e; margin-bottom:12px;">🗳️ 후보자 공약</h3>
          </div>
          <div id="public-opinion" style="margin-top:16px;">
            <h3 style="font-size:18px; color:#34495e; margin-bottom:8px;">💬 여론 확인</h3>
            <button id="open-opinion"
              style="margin-top:8px; padding:12px 16px; background:#5dade2; color:#fff;
                     border:none; border-radius:6px; cursor:pointer; font-size:14px;
                     font-weight:bold; width:100%;">
              📰 기사 및 댓글 보기
            </button>
          </div>
          <button id="go-vote"
            style="margin-top:10px; width:100%; padding:16px;
                   background:#e74c3c; color:#fff; border:none;
                   border-radius:8px; cursor:pointer; font-size:16px; font-weight:bold;">
            🗳️ 투표 하러 가기
          </button>
        </div>

        <!-- 우측 패널 -->
        <div id="right-panel" style="
            flex:1; padding:16px; overflow:auto;
            max-height:200px;
            background: #fafafa; border:1px solid #ddd;
            border-radius:8px; line-height:1.6; font-size:14px;
          ">
          <h3 style="margin-top:0; color:#2c3e50;">📝 공식 공약 확인 방법</h3>
          <ol style="padding-left:18px;">
            <li style="margin-bottom:12px;">
              중앙선거관리위원회 '정책·공약마당'<br/>
              <a href="https://policy.nec.go.kr" target="_blank"
                 style="color:#3498db; text-decoration:none;">policy.nec.go.kr</a><br/>
              <small style="color:#666;">• PDF 공약 전문 다운로드</small>
            </li>
            <li>
              대통령선거 특집 홈페이지<br/>
              <a href="https://vt.nec.go.kr" target="_blank"
                 style="color:#3498db; text-decoration:none;">vt.nec.go.kr</a><br/>
              <small style="color:#666;">• 후보 정보·투표소 안내</small>
            </li>
          </ol>
          
          <div style="background:#e8f4f8; padding:12px; border-radius:6px; margin-top:16px;">
            <p style="margin:0; font-size:13px; color:#2c3e50;">
              💡 <strong>팁:</strong> 정확한 정보는 공식 채널에서 확인하세요!
            </p>
          </div>
        </div>
      `;

      // 후보 목록 추가
      const candidates = [
        { key:'A', name:'김후보', policies:[
            '교육비 전면 무상화 추진',
            '청년 일자리 50만개 창출 계획 발표',
            '탈원전·신재생에너지 확대',
            '부동산 투기 근절법안 발의'
          ]
        },
        { key:'B', name:'이후보', policies:[
            '국민 건강보험 보장성 강화',
            'K-교통 인프라 4차 확충',
            '중소기업 혁신 펀드 1조원 조성',
            '디지털 규제 샌드박스 운영'
          ]
        },
        { key:'C', name:'박후보', policies:[
            '기초연금 30% 인상',
            '문화예술진흥 특별법 제정',
            '공공와이파이 전국 확충',
            '인공지능 윤리기준 마련'
          ]
        }
      ];
      
      const listEl = container.querySelector('#candidate-list');
      candidates.forEach(c => {
        const btn = document.createElement('button');
        btn.innerText = `${c.key}. ${c.name}`;
        Object.assign(btn.style, {
          display:'block', width:'100%', margin:'6px 0',
          padding:'10px', background:'#3498db', color:'#fff',
          border:'none', borderRadius:'6px', cursor:'pointer',
          textAlign:'left', fontSize:'14px', fontWeight:'bold'
        });
        btn.onclick = () => this._showCandidatePolicies(c, container);
        listEl.appendChild(btn);
      });

      // 기사 보기
      container.querySelector('#open-opinion').addEventListener('click', () => {
        // 1) 기존 기사+댓글 화면으로 전환
        this._showPublicOpinion(container);
        
        // 2) 동시에 Warning UI도 띄우기
        setTimeout(() => {
          this._showWarningUI();
        }, 100);
      });
      
      // 투표일 선택
      container.querySelector('#go-vote').addEventListener('click', () => this._showVoteDayChoice(container));

      this.phoneUI = new CSS2DObject(container);
      this.phoneUI.position.set(0, 1, 0);
      this.phoneModel.add(this.phoneUI);
    }
    this.phoneUI.element.style.display = '';
  }

  _showCandidatePolicies(candidate, container) {
    container.innerHTML = `
      <h2>${candidate.key}. ${candidate.name} 주요 공약</h2>
      <ul style="padding-left:18px;">${candidate.policies.map(p=>`<li>${p}</li>`).join('')}</ul>
      <button id="back-cand" style="margin-top:12px;padding:8px;background:#aaa;color:#fff;border:none;border-radius:4px;cursor:pointer;">뒤로</button>
    `;
    container.querySelector('#back-cand').onclick = () => {
      // 기존 UI 제거 후 다시 생성
      this.phoneModel.remove(this.phoneUI);
      this.phoneUI = null;
      this._showPhoneUI();
    };
  }

  _showWarningUI() {
    if (!this.warningUI) {
      const warningContainer = document.createElement('div');
      Object.assign(warningContainer.style, {
        width: '600px', 
        height: '700px', 
        padding: '24px',
        background: 'rgba(255,255,255,0.98)',
        color: '#222', 
        pointerEvents: 'auto', 
        borderRadius: '15px', 
        fontFamily: 'Malgun Gothic, sans-serif',
        fontSize: '15px', 
        boxShadow: '0 16px 32px rgba(0,0,0,0.5)', 
        overflow: 'hidden', 
        zIndex: '1001',
        border: '3px solid #e74c3c',
        position: 'relative'
      });
      
      const closeButton = document.createElement('button');
      closeButton.id = 'close-warning';
      closeButton.innerHTML = '×';
      Object.assign(closeButton.style, {
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        fontSize: '20px',
        fontWeight: 'bold',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10'
    });
      warningContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2 style="margin:0; color:#e74c3c; font-size:22px;">⚖️ 선거 비방 처벌 안내</h2>
        </div>

        <div id="warning-content" style="
          height: calc(100% - 80px); 
          overflow-y: scroll; 
          padding-right: 8px;
          line-height: 1.6;
        ">
          <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h3 style="margin-top:0; color:#856404;">🚨 중요 공지</h3>
            <p style="margin:0; font-weight:bold;">
              온라인에서 선거 관련 댓글 작성 시 <span style="color:#dc3545;">법적 처벌</span>을 받을 수 있습니다.
            </p>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #3498db; padding-bottom:8px;">📋 주요 처벌 조항</h3>
          <div style="display:grid; gap:12px; margin-bottom:24px;">
            <div style="background:#f8f9fa; padding:16px; border-radius:8px; border-left:4px solid #dc3545;">
              <h4 style="margin-top:0; color:#dc3545;">후보자비방죄 (제251조)</h4>
              <ul style="margin:0; padding-left:20px;">
                <li><strong>처벌:</strong> 3년 이하 징역 또는 500만원 이하 벌금</li>
                <li><strong>대상:</strong> 후보자를 비방하는 글, 댓글, 영상 등</li>
                <li><strong>범위:</strong> 사실 여부와 관계없이 비방 목적이면 처벌</li>
              </ul>
            </div>
            
            <div style="background:#f8f9fa; padding:16px; border-radius:8px; border-left:4px solid #e74c3c;">
              <h4 style="margin-top:0; color:#e74c3c;">허위사실공표죄 (제250조)</h4>
              <ul style="margin:0; padding-left:20px;">
                <li><strong>처벌:</strong> 5년 이하 징역 또는 3천만원 이하 벌금</li>
                <li><strong>대상:</strong> 거짓 정보로 후보자 당락에 영향을 미치는 행위</li>
                <li><strong>범위:</strong> SNS, 댓글, 메신저 등 모든 온라인 활동</li>
              </ul>
            </div>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #28a745; padding-bottom:8px;">🚨 실제 처벌 사례</h3>
          <div style="background:#fff3cd; padding:16px; border-radius:8px; margin-bottom:20px;">
            <ul style="margin:0; padding-left:20px; font-size:14px;">
              <li style="margin-bottom:8px;">온라인 커뮤니티 악성 댓글 → <strong>벌금 200만원</strong></li>
              <li style="margin-bottom:8px;">SNS 허위 정보 유포 → <strong>징역 6개월</strong></li>
              <li style="margin-bottom:8px;">유튜브 비방 영상 업로드 → <strong>벌금 500만원</strong></li>
              <li style="margin-bottom:8px;">인스타그램 허위 해시태그 → <strong>벌금 300만원</strong></li>
              <li>페이스북 후보자 인신공격 → <strong>벌금 150만원</strong></li>
            </ul>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #17a2b8; padding-bottom:8px;">✅ 건전한 참여 방법</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
            <div style="background:#d1ecf1; padding:12px; border-radius:6px;">
              <h4 style="margin-top:0; color:#0c5460;">권장사항</h4>
              <ul style="margin:0; padding-left:16px; font-size:13px;">
                <li>정책 중심의 건설적 토론</li>
                <li>사실에 근거한 의견 표명</li>
                <li>상대 후보 존중하는 표현</li>
                <li>출처 명확한 정보 공유</li>
              </ul>
            </div>
            <div style="background:#f8d7da; padding:12px; border-radius:6px;">
              <h4 style="margin-top:0; color:#721c24;">금지사항</h4>
              <ul style="margin:0; padding-left:16px; font-size:13px;">
                <li>인신공격성 발언</li>
                <li>허위사실 유포</li>
                <li>감정적 비방 댓글</li>
                <li>근거 없는 추측성 글</li>
              </ul>
            </div>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #6c757d; padding-bottom:8px;">📞 신고 및 문의</h3>
          <div style="background:#e2e3e5; padding:16px; border-radius:8px; margin-bottom:20px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:14px;">
              <div>
                <strong>🏛️ 중앙선거관리위원회</strong><br/>
                전화: 02-503-1114<br/>
                웹사이트: www.nec.go.kr
              </div>
              <div>
                <strong>💻 사이버선거범죄신고센터</strong><br/>
                전화: 1390<br/>
                웹사이트: cyber.nec.go.kr
              </div>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:20px; border-radius:10px; text-align:center;">
            <h3 style="margin-top:0; color:white;">🗳️ 건전한 선거문화를 만들어요!</h3>
            <p style="margin:0; font-size:14px; opacity:0.9;">
              비방과 허위정보가 아닌, 정책과 비전으로 후보를 평가하는 성숙한 민주주의를 실현합시다.
            </p>
          </div>
        </div>
      `;

      warningContainer.appendChild(closeButton);

      closeButton.addEventListener('click', (e) => {
        console.log('❌ X 버튼 클릭 이벤트 발생!');
        e.preventDefault();
        e.stopPropagation();
        this._hideWarningUI();
      });

    // 추가 안전장치 - mousedown으로도 처리
    closeButton.addEventListener('mousedown', (e) => {
        console.log('❌ X 버튼 mousedown 이벤트!');
        e.preventDefault();
        e.stopPropagation();
        this._hideWarningUI();
    });

      // 스크롤바 스타일링
      const style = document.createElement('style');
      style.textContent = `
        #warning-content::-webkit-scrollbar {
          width: 8px;
        }
        #warning-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        #warning-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        #warning-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `;
      if (!document.querySelector('#warning-scroll-style')) {
        style.id = 'warning-scroll-style';
        document.head.appendChild(style);
      }

      this.warningUI = new CSS2DObject(warningContainer);
      this.warningUI.position.set(25.0, 1, 0);
      this.phoneModel.add(this.warningUI);
    }
    
    this.warningUI.element.style.display = '';
    console.log('⚖️ 비방 처벌 안내 UI 표시');
  }

  _hideWarningUI() {
    if (this.warningUI) {
      this.warningUI.element.style.display = 'none';
      console.log('⚖️ 비방 처벌 안내 UI 숨김');
    }

    if (this.phoneModel && this.warningUI && this.warningUI.parent === this.phoneModel) {
      this.phoneModel.remove(this.warningUI);
      console.log('🔧 phoneModel에서 warningUI 제거 완료');
    }
  }
  // 여론 확인: 좌/우 패널 모두 업데이트
  _showPublicOpinion(container) {
    // 좌측 패널 채우기
    const left = container.querySelector('#left-panel');
    left.innerHTML = `
        <h2 style="margin-top:0;">📰 최신 기사</h2>
        <div id="articles" style="flex:1; overflow-y:auto; margin-bottom:8px;"></div>
        <h3 style="margin:8px 0 4px;">댓글</h3>
        <div id="comments" style="flex:1; overflow-y:auto; margin-bottom:8px;"></div>
        <textarea id="new-comment" placeholder="댓글 작성..." style="
        width:100%; height:60px; box-sizing:border-box;
        padding:6px; border:1px solid #aaa; border-radius:4px;
        "></textarea>
        <button id="submit-comment" style="
        margin-top:6px; padding:8px; background:#3498db; color:#fff;
        border:none; border-radius:4px; cursor:pointer;
        ">댓글 제출</button>
  `;

    const articles = [
      { title:'A 후보, 심각한 부패 의혹 제기', content:'최근 언론 보도에 따르면 A 후보의 측근들이 대규모 뇌물 수수 정황이 포착되었습니다...' },
      { title:'B 후보, 대중교통 예산 삭감 논란', content:'이 후보의 예산안이 서울 시내버스·지하철 예산을 30% 삭감한다고 발표해 논란이 일고 있습니다...' }
    ];
    const artDiv = left.querySelector('#articles');
    articles.forEach(a => {
        const el = document.createElement('div');
        el.style.marginBottom = '12px';
        el.innerHTML = `<strong>${a.title}</strong><p style="margin:4px 0;">${a.content}</p>`;
        artDiv.appendChild(el);
    });

    // 댓글 섹션
    const cmDiv = left.querySelector('#comments');
    const comments = [ { text:'👤 정말 충격이네요...', likes:12, dislikes:3 }, { text:'👤 사실 확인이 필요합니다.', likes:8, dislikes:2 } ];
    comments.forEach((c,i) => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '8px';
    wrap.innerHTML = `
      <p style="margin:0 0 4px;">${c.text}</p>
      <button id="like${i}">👍 ${c.likes}</button>
      <button id="dis${i}">👎 ${c.dislikes}</button>
    `;
    cmDiv.appendChild(wrap);
    wrap.querySelector(`#like${i}`)
        .onclick = () => wrap.querySelector(`#like${i}`)
                        .innerText = `👍 ${++c.likes}`;
    wrap.querySelector(`#dis${i}`)
        .onclick = () => wrap.querySelector(`#dis${i}`)
                        .innerText = `👎 ${++c.dislikes}`;
    });

    // 댓글 제출 로직 
    left.querySelector('#submit-comment').onclick = (e) => {
    try {
      e.preventDefault(); // 기본 동작 방지
      
      const textArea = left.querySelector('#new-comment');
      const text = textArea.value.trim();
      
      console.log('📝 댓글 제출:', text); // 디버깅용
      
      if (!text) {
        alert('댓글을 입력해주세요.');
        return;
      }
      
      // 🚨 비방 댓글 체크 (더 정확한 체크)
      const badWords = ['비방', '욕설', '인신공격', '거짓말쟁이', '무능한', '바보', '멍청이', '쓰레기', '개새끼', '병신'];
      const hasBadWord = badWords.some(word => text.includes(word));
      
      if (hasBadWord) {
        // 🔧 처벌 메시지와 함께 리스폰 위치 설정
        alert('비방성 댓글은 처벌받을 수 있습니다. 메인 화면으로 돌아갑니다.');
          
        // 1) 카메라 위치를 리스폰 지점으로 미리 설정
        const respawnPosition = new THREE.Vector3(104.98, 50, 499.92);
        this.camera.position.copy(respawnPosition);
        this.camera.lookAt(104.98, 50, 400);
        this.cameraYaw = 0;
        this.cameraPitch = 0;
        this._updateCameraRotation();

        console.log('🚨 비방 댓글 감지! 리스폰 위치로 이동:', respawnPosition);

        // 2) UI 정리
        this._hideWarningUI();
        if (this.phoneUI) {
            this.phoneModel.remove(this.phoneUI);
            this.phoneUI = null;
        }

        // 3) 홈으로 전환 (카메라는 이미 리스폰 위치에 설정됨)
        this.sceneManager.transitionTo('home');
        return;
        }
      
      // 정상 댓글 추가
      const commentsDiv = left.querySelector('#comments');
      if (commentsDiv) {
        const newComment = document.createElement('div');
        newComment.style.marginBottom = '8px';
        newComment.style.padding = '8px';
        newComment.style.background = '#e8f5e8'; // 새 댓글은 연한 초록색
        newComment.style.borderRadius = '4px';
        newComment.style.border = '1px solid #4caf50';
        
        newComment.innerHTML = `
          <p style="margin:0 0 4px;">👤 ${text}</p>
          <div style="display:flex; gap:8px;">
            <button style="padding:4px 8px; background:#e3f2fd; border:1px solid #2196f3; border-radius:3px; cursor:pointer;" disabled>
              👍 0
            </button>
            <button style="padding:4px 8px; background:#ffebee; border:1px solid #f44336; border-radius:3px; cursor:pointer;" disabled>
              👎 0
            </button>
          </div>
          <small style="color:#666; font-size:11px;">방금 전</small>
        `;
        
        // 새 댓글을 맨 위에 추가
        commentsDiv.insertBefore(newComment, commentsDiv.firstChild);
        
        // 입력창 초기화
        textArea.value = '';
        
        console.log('✅ 댓글 추가 완료'); // 디버깅용
        
        // 성공 알림
        const submitBtn = left.querySelector('#submit-comment');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = '✅ 등록완료';
        submitBtn.style.background = '#28a745';
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.style.background = '#3498db';
        }, 1000);
        
      } else {
        console.error('❌ 댓글 컨테이너를 찾을 수 없습니다');
      }
      
    } catch (error) {
      console.error('❌ 댓글 제출 중 오류:', error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  // 뒤로가기 버튼을 컨테이너 밖으로 이동
  if (!container.querySelector('#back-opinion')) {
    const back = document.createElement('button');
    back.id = 'back-opinion';
    back.innerText = '← 뒤로';
    Object.assign(back.style, {
      position: 'absolute',
      bottom: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      background: '#6c757d',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      zIndex: '20',
      fontWeight: 'bold',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    });
    back.onclick = () => {
      this.phoneModel.remove(this.phoneUI);
      this.phoneUI = null;
      this._showPhoneUI();
    };
    container.appendChild(back);
  }
}
  }