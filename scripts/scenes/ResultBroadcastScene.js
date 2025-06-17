// ResultBroadcastScene.js
import * as THREE from 'three';
import { envModelLoader } from '../utils/processImport.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import Candidate from '../utils/Candidate.js';

import ProgressResultRenderer from '../utils/ProgressResultRenderer.js';
import BarUtil from '../utils/bar.js';


export default class ResultBroadcastScene {
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
    this.requiredCount = 30;
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
        console.log('🖱 TV clicked, revealing overlay.');
        // Only assign the render target material if TV hasn't started yet
        screenMesh.material = this.tvRenderTargetMaterial;
        this.tvBroadcastStarted = true;
        // Reset timer and tap count from click moment
        this.startTime = performance.now();
        this.keyPressCount = 0;
        // initialize bar overlay when TV is clicked
        this._setupTVbarOverlay();
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
}
  