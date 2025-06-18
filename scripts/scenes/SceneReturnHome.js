import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { envModelLoader } from '../utils/processImport.js';
import CollisionControl from '../utils/collisionControl.js';

export default class SceneReturnHome {
    constructor(renderer, camera, sceneManager) {
        this.renderer = renderer;
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.scene = new THREE.Scene();
        this.collisionControl = new CollisionControl(camera);
        
        // 초기화 상태 추적
        this.initialized = false;
        
        // 이동 및 인터랙션 시스템 (가벼운 초기화만)
        this.keys = { w: false, a: false, s: false, d: false };
        this.moveSpeed = 0.3;
        this.wallPosterObject = null;
        this.highlightedObject = null;
        this.originalMaterial = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.interactionDistance = 70;
        
        // 카메라 회전 시스템
        this.isRotating = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraRotation = { horizontal: 0, vertical: 0 };
        this.rotationLimits = {
            horizontal: { min: -Math.PI / 2, max: Math.PI / 2},
            vertical: { min: -Math.PI / 6, max: Math.PI / 6 }
        };
        this.rotationSpeed = 0.002;
        
        // 하이라이트 머티리얼
        this.highlightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.3 
        });
        
        // UI 요소들 (나중에 생성)
        this.hoverLabel = null;
        this.modal = null;
        this.floatingMessage = null;
        
        // 이벤트 리스너 함수들을 미리 바인딩 (이건 가벼워서 괜찮음)
        this._setupEventListenerFunctions();
        
        console.log('SceneReturnHome constructor called (lightweight)');
    }

    // --------------------------
    //  initialize scene (called in onEnter)
    // --------------------------
    _initScene() {
        // 기본 안개 설정
        this.scene.fog = new THREE.FogExp2(0x856d71, 0.01);
        
        const rgbeLoader = new RGBELoader();
        
        rgbeLoader.load('./assets/textures/the_sky_is_on_fire_2k.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            
            // 환경 조명 적용
            this.scene.environment = texture;
            this.scene.environmentIntensity = 0.8;
            
            // 배경으로도 사용
            this.scene.background = texture;
            this.scene.backgroundBlurriness = 0.3;
        });

        // 라이팅 강화
        const ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambient);
        
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight1.position.set(5, 10, 7);
        this.scene.add(dirLight1);
        
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight2.position.set(-5, 10, -7);
        this.scene.add(dirLight2);
        
        const dirLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight3.position.set(0, 10, -10);
        this.scene.add(dirLight3);
        
        console.log('Scene lighting and HDR initialized');
    }

    _createUI() {
        // 호버 라벨 - CSS 클래스 사용
        this.hoverLabel = document.createElement('div');
        this.hoverLabel.className = 'hover-label';
        this.hoverLabel.style.display = 'none'; // 초기에는 숨김
        document.body.appendChild(this.hoverLabel);

        // 선택지 모달 - CSS 클래스 사용
        this.modal = document.createElement('div');
        this.modal.className = 'choice-modal';
        this.modal.style.display = 'none'; // 초기에는 숨김
        document.body.appendChild(this.modal);
        
        // Floating 메시지 - CSS 클래스 사용
        this.floatingMessage = document.createElement('div');
        this.floatingMessage.className = 'floating-message';
        this.floatingMessage.textContent = '↱ 길 건너에 선거 벽보가 있는 것 같다! 구경하러 가보자. ↱';
        this.floatingMessage.style.display = 'none'; // 초기에는 숨김
        document.body.appendChild(this.floatingMessage);
        
        // 휴대폰 UI 생성
        this.phoneUI = document.createElement('div');
        this.phoneUI.className = 'phone-ui';
        this.phoneUI.style.display = 'none'; // 초기에는 숨김
        this.phoneUI.innerHTML = `
            <div class="phone-screen">
                <div class="phone-header">
                    <div class="phone-time">14:30</div>
                    <div class="phone-status">
                        <span>●●●</span>
                        <span>📶</span>
                        <span>🔋</span>
                    </div>
                </div>
                <div class="message-container">
                    <div class="message-bubble friend">
                        <div class="message-sender">친구</div>
                        <div class="message-text">너 누구 뽑았어?!</div>
                        <div class="message-time">지금</div>
                    </div>
                </div>
                <div class="choice-buttons">
                    <button id="tell-friend" class="phone-choice-btn">나 당연히 ㅇㅇㅇ 뽑았지!</button>
                    <button id="keep-secret" class="phone-choice-btn">비밀이야 ㅋㅋ</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.phoneUI);
    }

    _loadOutdoorModel() {
        const possiblePaths = [
            './assets/models/outdoor.glb',      // debug-return-home.html에서
            '../assets/models/outdoor.glb',     // scripts 폴더에서
            'assets/models/outdoor.glb'         // 상대 경로
        ];
        
        envModelLoader.loadEnvironmentModel(
            'outdoor',
            possiblePaths,
            this.scene,
            (modelRoot) => {
                // 모델 90도 회전 (Y축 기준)
                modelRoot.rotation.y = Math.PI / 2;
                
                // 성공 콜백: 모델이 로드되면 Wall_Poster 오브젝트를 찾아서 저장
                this.wallPosterObject = envModelLoader.findObjectInModel('outdoor', 'Wall_Poster');
                
                console.log('Outdoor model loaded successfully');
                
                // 충돌 오브젝트 등록
                this.collisionControl.addCollidableModel(modelRoot);
                this.collisionControl.removeCollidableObject(this.wallPosterObject);
                
                // 디버그용: 충돌 오브젝트 수 출력
                console.log(`Registered collision objects: ${this.collisionControl.getCollidableObjectCount()}`);
            },
            null,
            (error) => {
                // 에러 콜백
                console.error('Outdoor model loading failed:', error);
            }
        );
    }

    _setupEventListenerFunctions() {
        // 이벤트 리스너 함수들만 정의 (실제 등록은 onEnter에서)
        this.onKeyDown = (event) => {
            const key = event.key.toLowerCase();
            if (key in this.keys) this.keys[key] = true;
        };
        
        this.onKeyUp = (event) => {
            const key = event.key.toLowerCase();
            if (key in this.keys) this.keys[key] = false;
        };

        // 마우스 이벤트
        this.onMouseMove = (event) => {
            // 좌클릭 드래그로 카메라 회전
            if (this.isRotating) {
                const deltaX = event.clientX - this.previousMousePosition.x;
                const deltaY = event.clientY - this.previousMousePosition.y;
                
                // 회전 각도 계산 (제한 적용)
                this.cameraRotation.horizontal += deltaX * this.rotationSpeed;
                this.cameraRotation.vertical += deltaY * this.rotationSpeed;
                
                // 각도 제한 적용
                this.cameraRotation.horizontal = Math.max(
                    this.rotationLimits.horizontal.min,
                    Math.min(this.rotationLimits.horizontal.max, this.cameraRotation.horizontal)
                );
                
                this.cameraRotation.vertical = Math.max(
                    this.rotationLimits.vertical.min,
                    Math.min(this.rotationLimits.vertical.max, this.cameraRotation.vertical)
                );
                
                // 카메라 회전 적용
                this._applyCameraRotation();
                
                this.previousMousePosition.x = event.clientX;
                this.previousMousePosition.y = event.clientY;
                return;
            }
            
            // 기존 호버 로직 (좌클릭이 아닐 때만)
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // 이전 하이라이트 제거
            if (this.highlightedObject && this.originalMaterial) {
                this.highlightedObject.material = this.originalMaterial;
                this.highlightedObject = null;
                this.originalMaterial = null;
            }
            
            // Wall_Poster 오브젝트만 체크 (단일 오브젝트)
            if (this.wallPosterObject) {
                // 벽보의 월드 위치 가져오기
                const wallPosterWorldPos = this.wallPosterObject.getWorldPosition(new THREE.Vector3());
                // 카메라와 Wall_Poster 사이의 거리 체크
                const distance = this.camera.position.distanceTo(wallPosterWorldPos);
                
                if (distance <= this.interactionDistance) {
                    const intersects = this.raycaster.intersectObject(this.wallPosterObject, true);
                    
                    if (intersects.length > 0) {
                        const obj = intersects[0].object;
                        
                        // 하이라이트 적용
                        this.highlightedObject = obj;
                        this.originalMaterial = obj.material;
                        obj.material = this.highlightMaterial;
                        
                        // 호버 라벨 표시 (UI가 생성된 경우에만)
                        if (this.hoverLabel) {
                            this.hoverLabel.textContent = "선거 벽보";
                            this.hoverLabel.style.left = event.clientX + 10 + 'px';
                            this.hoverLabel.style.top = event.clientY + 10 + 'px';
                            this.hoverLabel.style.display = 'block';
                        }
                        return;
                    }
                } else {
                    // 거리가 멀면 "너무 멀다" 메시지 표시 (선택사항)
                    // console.log(`Too far from Wall_Poster: ${distance.toFixed(1)} > ${this.interactionDistance}`);
                }
            }
            
            // 라벨 숨김 
            if (this.hoverLabel) {
                this.hoverLabel.style.display = 'none';
            }
        };

        this.onMouseDown = (event) => {
            if (event.button === 0) { // 좌클릭
                this.isRotating = true;
                this.previousMousePosition.x = event.clientX;
                this.previousMousePosition.y = event.clientY;
                event.preventDefault();
            }
        };

        this.onMouseUp = (event) => {
            if (event.button === 0) { // 좌클릭 (onMouseDown과 일치)
                this.isRotating = false;
            }
        };

        this.onContextMenu = (event) => {
            event.preventDefault(); // 우클릭 컨텍스트 메뉴 비활성화
        };

        this.onMouseClick = (event) => {
            // 카메라 회전 중이면 클릭 무시
            if (this.isRotating) return;
            
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Wall_Poster 오브젝트만 체크 (단일 오브젝트)
            if (this.wallPosterObject) {
                // 벽보의 월드 위치 가져오기
                const wallPosterWorldPos = this.wallPosterObject.getWorldPosition(new THREE.Vector3());
                // 카메라와 Wall_Poster 사이의 거리 체크
                const distance = this.camera.position.distanceTo(wallPosterWorldPos);
                
                if (distance <= this.interactionDistance) {
                    const intersects = this.raycaster.intersectObject(this.wallPosterObject, true);
                    
                    if (intersects.length > 0) {
                        this._showModal();
                    }
                } else {
                    console.log(`Wall_Poster is too far away: ${distance.toFixed(1)} units (max: ${this.interactionDistance})`);
                    console.log(`Camera position: ${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)}`);
                    console.log(`Wall_Poster world position: ${wallPosterWorldPos.x.toFixed(1)}, ${wallPosterWorldPos.y.toFixed(1)}, ${wallPosterWorldPos.z.toFixed(1)}`);
                }
            }
        };
    }

    _showModal() {
        if (!this.modal) return;
        
        this.modal.innerHTML = `
            <p>선거 벽보가 붙어있다! 내가 좋아하는 후보에게 왠지 하트를 마구마구 그려주고 싶다. 벽보에 하트를 그릴까?</p>
            <button id="draw-heart">하트를 큼직하게 그린다.</button>
            <button id="pass-by">그냥 지나간다.</button>
        `;
        this.modal.style.display = 'block';
        
        // 이벤트 리스너 등록
        document.getElementById('draw-heart').onclick = () => {
            this.modal.style.display = 'none';
            this.sceneManager.transitionTo('home'); // 씬 이름 수정
        };
        
        document.getElementById('pass-by').onclick = () => {
            this.modal.style.display = 'none';
            this.sceneManager.transitionTo('resultBroadcast'); // 씬 이름 수정
        };
    }

    _updateMovement() {
        const direction = new THREE.Vector3();
        
        if (this.keys.w) direction.z += 1;  // W = 앞으로 (양의 z)
        if (this.keys.s) direction.z -= 1;  // S = 뒤로 (음의 z)
        if (this.keys.a) direction.x -= 1;  // A = 왼쪽 (음의 x)
        if (this.keys.d) direction.x += 1;  // D = 오른쪽 (양의 x)
        
        if (direction.length() > 0) {
            direction.normalize();
            
            // 카메라의 현재 방향을 가져옴
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            // 카메라의 오른쪽 방향 계산
            const right = new THREE.Vector3();
            right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
            
            // 이동 벡터 계산
            const movement = new THREE.Vector3();
            movement.addScaledVector(cameraDirection, direction.z * this.moveSpeed);
            movement.addScaledVector(right, direction.x * this.moveSpeed);
            movement.y = 0;
            
            // 충돌 체크 후 이동
            if (this.collisionControl.preventCollision(movement)) {
                this.camera.position.add(movement);
            }
        }
    }

    // 씬 진입 시 호출 
    onEnter() {
        // 한 번만 초기화
        if (!this.initialized) {
            console.log('🎬 SceneReturnHome 초기화 시작...');
            
            // 무거운 작업들을 여기서 실행
            this._initScene();
            this._createUI();
            this._loadOutdoorModel();
            
            this.initialized = true;
            console.log('✅ SceneReturnHome 초기화 완료');
        }
        
        // 카메라 초기 위치 설정 (회전된 모델에 맞게 조정)
        this.camera.position.set(-130, 10, 15);
        
        // 이벤트 리스너 등록 (매번 입장할 때마다)
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('click', this.onMouseClick);
        
        // UI 초기 상태 설정
        this._hideAllUI();
        this._showFloatingMessage();
        
        // 10초 후 휴대폰 UI 표시
        setTimeout(() => {
            this._showPhoneUI();
        }, 10000);
    }

    // 씬 종료 시 호출
    onExit() {
        // 이벤트 리스너 해제
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('contextmenu', this.onContextMenu);
        window.removeEventListener('click', this.onMouseClick);
        
        // UI 정리 및 하이라이트 제거
        this._hideAllUI();
        this._clearHighlight();
        
        // 디버그 UI 완전 제거
        const debugUI = document.getElementById('debug-ui');
        if (debugUI) {
            debugUI.remove();
        }
    }

    // UI 상태 관리 헬퍼 메서드들
    _hideAllUI() {
        if (this.hoverLabel) this.hoverLabel.style.display = 'none';
        if (this.modal) this.modal.style.display = 'none';
        if (this.floatingMessage) this.floatingMessage.style.display = 'none';
        if (this.phoneUI) this.phoneUI.style.display = 'none';
    }

    _clearHighlight() {
        if (this.highlightedObject && this.originalMaterial) {
            this.highlightedObject.material = this.originalMaterial;
            this.highlightedObject = null;
            this.originalMaterial = null;
        }
    }

    _showFloatingMessage() {
        if (this.floatingMessage) {
            this.floatingMessage.style.display = 'block';
            setTimeout(() => {
                if (this.floatingMessage) {
                    this.floatingMessage.style.display = 'none';
                }
            }, 5000);
        }
    }

    _showPhoneUI() {
        if (this.phoneUI) {
            this.phoneUI.style.display = 'block';
            
            // 선택지 이벤트 리스너 추가
            const tellFriendBtn = document.getElementById('tell-friend');
            const keepSecretBtn = document.getElementById('keep-secret');
            
            if (tellFriendBtn) {
                tellFriendBtn.onclick = () => {
                    this.phoneUI.style.display = 'none';
                    this.sceneManager.transitionTo('home');
                };
            }
            
            if (keepSecretBtn) {
                keepSecretBtn.onclick = () => {
                    this.phoneUI.style.display = 'none';
                    // 계속 현재 씬에서 진행 (벽보 이벤트로)
                };
            }
        }
    }

    // 매 프레임마다 호출
    update() {
        this._updateMovement();
    }

    // 렌더링 (SceneManager에서 호출)
    render() {
        this.renderer.setClearColor(0x111122);
    }

    _applyCameraRotation() {
        this.camera.rotation.set(
            this.cameraRotation.vertical,
            this.cameraRotation.horizontal,
            0,
            'YXZ'
        );
    }

    // 메모리 정리 (선택사항)
    dispose() {
        // UI 요소들 제거
        if (this.hoverLabel && this.hoverLabel.parentNode) {
            this.hoverLabel.parentNode.removeChild(this.hoverLabel);
        }
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        if (this.floatingMessage && this.floatingMessage.parentNode) {
            this.floatingMessage.parentNode.removeChild(this.floatingMessage);
        }
        
        // Three.js 객체들 정리
        if (this.scene) {
            this.scene.clear();
        }
        
        console.log('SceneReturnHome disposed');
    }
}

// window에 클래스 노출
window.SceneReturnHome = SceneReturnHome;