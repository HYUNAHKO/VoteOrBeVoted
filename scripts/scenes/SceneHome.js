// SceneHome.js - 기존 구조에 맞춘 최소 수정 + 이동 조작 + 핸드폰 상호작용
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

export default class SceneHome {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.mixer = null;
    this.assetsLoaded = false;
    this.bedroomModel = null;
    this.phoneModel = null;

    // 이동 조작을 위한 변수들
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canLook = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    // 카메라 회전을 위한 별도 변수 (더 안정적인 제어)
    this.cameraYaw = 0;    // 좌우 회전
    this.cameraPitch = 0;  // 상하 회전
    
    // 방 정보 (에셋 로딩 후 설정됨)
    this.roomInfo = null;
    this.phoneGlow = null;

    // GLTF 로더 생성
    this.gltfLoader = new GLTFLoader();

    this._init();
  }

  _init() {
    // 1) 배경 - 어두운 로딩 상태
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // 2) 기본 조명만 (에셋 로드 전)
    this._setupBasicLighting();
    
    // 3) 텍스트 오버레이
    this._createTextOverlay();
    
    // 4) 실제 다운로드받은 에셋 로드
    this._loadActualBedroom();
  }

  async _loadActualBedroom() {
    try {
      console.log('🎯 실제 다운로드받은 방 에셋 로딩 중...');
      
      // 메인 파일만 로드
      const filePath = './assets/models/bedroom-scene.glb';
      
      console.log(`🔍 로딩: ${filePath}`);
      const loadedAsset = await this._loadGLTFDirect(filePath);
      console.log(`✅ 성공: ${filePath}`);
      
      // 성공적으로 로드된 에셋 처리
      this.bedroomModel = loadedAsset.scene;
      
      console.log('📐 에셋 정보:', {
        children: this.bedroomModel.children.length,
        animations: loadedAsset.animations?.length || 0
      });
      
      // 에셋 최적화
      this._optimizeLoadedAsset();
      
      // 씬에 추가
      this.scene.add(this.bedroomModel);
      
      // 에셋에 맞게 환경 조정
      this._adjustEnvironmentForAsset();
      
      // ✨ 방 내부에 카메라 자동 배치
      this._autoPositionCameraInside();
      
      this.assetsLoaded = true;
      
      console.log('🎉 실제 방 에셋 로딩 완료!');
      console.log('📷 카메라는 고정 위치 (0, 1.6, 5) 사용 중');
      
    } catch (error) {
      console.error('💥 방 에셋 로딩 실패:', error);
      console.error('💡 확인사항: assets/models/bedroom-scene.glb 파일이 있는지 체크해주세요');
    }
  }

  _loadGLTFDirect(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf);
        },
        (progress) => {
          // 진행률은 콘솔에만 출력
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`📊 로딩 진행률: ${percent}%`);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

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
    // 기존 기본 조명 제거
    const lightsToRemove = [];
    this.scene.traverse((child) => {
      if (child.isLight) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach(light => this.scene.remove(light));
    
    // 에셋에 맞는 조명 설정
    
    // 1) 부드러운 주변광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // 2) 주 방향광 (자연스러운 느낌)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);
    
    // 3) 보조 포인트 라이트
    const fillLight = new THREE.PointLight(0xffd4a3, 0.4, 20);
    fillLight.position.set(-5, 3, 2);
    this.scene.add(fillLight);
    
    // 4) 배경색 조정 (에셋에 어울리게)
    this.scene.background = new THREE.Color(0xf8f8f8);
    
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
    const size   = box.getSize(new THREE.Vector3());
    console.log('🏠 정제된 방 바운딩:', box.min, box.max);

    // 3) 수동 시작 위치로 덮어쓰기
    const manualStart = new THREE.Vector3(104.98, 3, 499.92);
    this.camera.position.copy(manualStart);
    this.camera.lookAt(center);
    this.cameraYaw   = 0;
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
      🏠 집에서 뒹굴거리면서 투표나 해볼까?<br/>
      <div style="font-size: 16px; margin-top: 15px; color: #ccc;">
        📱 핸드폰을 클릭해서 투표하기<br/>
        🎮 WASD로 이동 + 우클릭 드래그로 시점 변경
      </div>
    `;
  }

  // 기존 구조에 맞춘 onEnter 메서드
  onEnter() {
    console.log('SceneHome onEnter');

    // 1) 초기 로딩 전 기본 위치 세팅
    if (!this.assetsLoaded) {
        this.camera.position.set(0, 2, 8);
        this.camera.rotation.set(0, 0, 0);
        this.camera.lookAt(0, 1, 0);
        this.camera.updateProjectionMatrix();
    }
    this.cameraYaw = 0;
    this.cameraPitch = 0;

    // 2) 조작 이벤트 등록, UI 추가 등
    this._setupControls();
    document.body.appendChild(this.textOverlay);

    // 3) 에셋 로딩 완료 후 강제 수동 위치 재적용
    const startScene = () => {
        if (this.assetsLoaded) {
        console.log('📷 방 내부 카메라 배치 완료 (자동 & 수동 적용)');
        // 핸드폰 추가
        this._addPhoneToDesk();

        // 수동 좌표로 재세팅
        this.camera.position.set(104.98, 50, 499.92);
        this.camera.lookAt(this.roomInfo.center);
        console.log('📷 startScene: 수동 카메라 위치 재세팅:', this.camera.position);

        // 텍스트 페이드인/out 등
        setTimeout(() => this.textOverlay.style.opacity = '1', 800);
        setTimeout(() => this.textOverlay.style.opacity = '0', 5000);
        } else {
        setTimeout(startScene, 100);
        }
    };
    startScene();
    }


  // 기존 구조에 맞춘 onExit 메서드
  onExit() {
    console.log('SceneHome onExit');
    
    // UI 제거
    if (this.textOverlay && this.textOverlay.parentNode) {
      this.textOverlay.parentNode.removeChild(this.textOverlay);
    }
    
    // 이동 조작 이벤트 제거
    this._removeControls();
  }

  // 이동 조작 설정
  _setupControls() {
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
          
        // 🔧 디버깅용 카메라 위치 조정 단축키
        case 'Digit1':
          this._debugTeleport(1);
          break;
        case 'Digit2':
          this._debugTeleport(2);
          break;
        case 'Digit3':
          this._debugTeleport(3);
          break;
        case 'Digit4':
          this._debugTeleport(4);
          break;
        case 'KeyP':
          this._printCameraInfo();
          break;
        case 'KeyR':
          this._resetToRoomCenter();
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
    
    // 클릭 이벤트 (핸드폰 상호작용용)
    this.onMouseClick = (event) => {
      if (event.button === 0 && this.phoneModel) { // 좌클릭
        this._checkPhoneClick(event);
      }
    };
    
    // 이벤트 등록
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('click', this.onMouseClick);
    
    // 우클릭 메뉴 비활성화
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    console.log('🎮 개선된 이동 조작 활성화:');
    console.log('   📱 좌클릭: 핸드폰 상호작용');
    console.log('   🎯 우클릭 + 드래그: 시점 변경');
    console.log('   ⌨️  WASD/방향키: 시점에 맞춘 이동');
    console.log('   🔧 디버깅 단축키:');
    console.log('      P: 현재 카메라 위치 출력');
    console.log('      R: 방 중앙으로 리셋');
    console.log('      1-4: 미리 설정된 위치로 텔레포트');
  }

  // 🔧 디버깅용 함수들
  _printCameraInfo() {
    console.log('📷 현재 카메라 정보:');
    console.log('   위치:', this.camera.position);
    console.log('   회전:', { yaw: this.cameraYaw, pitch: this.cameraPitch });
    
    if (this.roomInfo) {
      console.log('🏠 방 정보:');
      console.log('   중앙:', this.roomInfo.center);
      console.log('   크기:', this.roomInfo.size);
      console.log('   최소:', this.roomInfo.box.min);
      console.log('   최대:', this.roomInfo.box.max);
    }
    
    if (this.phoneModel) {
      console.log('📱 핸드폰 위치:', this.phoneModel.position);
    }
  }

  _debugTeleport(position) {
    const positions = {
      1: { pos: [0, 2, 0], name: '원점 위' },
      2: { pos: [0, 2, 5], name: '원점에서 뒤쪽' },
      3: { pos: [0, 2, -5], name: '원점에서 앞쪽' },
      4: { pos: [5, 2, 0], name: '원점에서 오른쪽' }
    };
    
    if (this.roomInfo) {
      const { center, size } = this.roomInfo;
      positions[1] = { pos: [center.x, center.y, center.z], name: '방 중앙' };
      positions[2] = { pos: [center.x, center.y + 1, center.z + size.z * 0.4], name: '방 뒤쪽' };
      positions[3] = { pos: [center.x, center.y + 1, center.z - size.z * 0.4], name: '방 앞쪽' };
      positions[4] = { pos: [center.x + size.x * 0.4, center.y + 1, center.z], name: '방 오른쪽' };
    }
    
    const target = positions[position];
    if (target) {
      this.camera.position.set(...target.pos);
      this.cameraYaw = 0;
      this.cameraPitch = 0;
      this._updateCameraRotation();
      
      console.log(`🚀 텔레포트: ${target.name} (${target.pos.join(', ')})`);
    }
  }

  _resetToRoomCenter() {
    if (this.roomInfo) {
      const { center, size } = this.roomInfo;
      this.camera.position.set(center.x, center.y + 1.5, center.z);
      this.cameraYaw = 0;
      this.cameraPitch = 0;
      this._updateCameraRotation();
      
      console.log('🏠 방 중앙으로 리셋:', this.camera.position);
    } else {
      this.camera.position.set(0, 2, 0);
      this.cameraYaw = 0;
      this.cameraPitch = 0;
      this._updateCameraRotation();
      
      console.log('📍 기본 위치로 리셋:', this.camera.position);
    }
  }

  _removeControls() {
    if (this.onKeyDown) {
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousedown', this.onMouseDown);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('click', this.onMouseClick);
    }
    document.body.style.cursor = 'default';
  }

  // 기존 구조에 맞춘 update 메서드
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
      
      // 핸드폰 glow 효과 (깜빡임)
      if (this.phoneGlow) {
        this.phoneGlow.material.opacity = 0.1 + Math.sin(time * 3) * 0.1;
      }
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
      
      // 🔧 이동할 때마다 위치 출력 (디버깅용)
      if (Date.now() % 500 < 16) { // 0.5초마다 한 번씩만 출력
        console.log('🚶 현재 위치:', {
          x: Math.round(this.camera.position.x * 100) / 100,
          y: Math.round(this.camera.position.y * 100) / 100,
          z: Math.round(this.camera.position.z * 100) / 100
        });
      }
    }
  }

  // 카메라 회전 업데이트 (새 함수 추가)
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

  // 책상 위에 핸드폰 추가 
  _addPhoneToDesk() {
    // 폰 모델 생성 (박스 형태)
    const phoneGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.01);
    const phoneMaterial = new THREE.MeshPhongMaterial({
        color: 0x2c2c2c,
        shininess: 100
    });
    this.phoneModel = new THREE.Mesh(phoneGeometry, phoneMaterial);

    // 1) 스케일 조정 (30배)
    const scaleFactor = 30;
    this.phoneModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // 2) 폰을 가로로 눕히기 (X축 90도 회전)
    this.phoneModel.rotation.x = -Math.PI / 2;

    // 3) 수동 위치 설정
    const manualPhonePos = new THREE.Vector3(146.46, 25, 382.79);
    this.phoneModel.position.copy(manualPhonePos);
    console.log('📱 수동 핸드폰 위치 및 방향 설정:', manualPhonePos, this.phoneModel.rotation);

    // 4) 그림자 및 클릭 이벤트 설정
    this.phoneModel.castShadow = true;
    this.phoneModel.userData = { clickable: true, action: 'phoneCheck' };
    this.scene.add(this.phoneModel);

    // 5) 글로우 효과 생성 (크기 확대)
    const glowRadius = 0.5;
    const glowGeometry = new THREE.SphereGeometry(glowRadius, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    // 폰 스케일에 맞춰 글로우도 스케일링
    glow.scale.set(scaleFactor, scaleFactor, scaleFactor);
    glow.position.copy(manualPhonePos);
    this.scene.add(glow);
    this.phoneGlow = glow;
    }

  // 핸드폰 클릭 체크
  _checkPhoneClick(event) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // 마우스 좌표를 정규화된 장치 좌표로 변환
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, this.camera);
    
    const intersects = raycaster.intersectObject(this.phoneModel);
    
    if (intersects.length > 0) {
      console.log('📱 핸드폰 클릭됨!');
      
      // 클릭 효과
      this.phoneModel.material.emissive.setHex(0x444444);
      setTimeout(() => {
        this.phoneModel.material.emissive.setHex(0x000000);
      }, 200);
      
      // phoneCheck 씬으로 전환
      setTimeout(() => {
        this.sceneManager.transitionTo('phoneCheck');
      }, 300);
    }
  }

  // 기존 구조에 맞춘 render 메서드
  render() {
    // 배경색 설정 등
    this.renderer.setClearColor(this.assetsLoaded ? 0xf8f8f8 : 0x1a1a1a);
  }

}