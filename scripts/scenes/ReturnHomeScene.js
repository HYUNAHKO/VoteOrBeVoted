import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

class SceneReturnHome {
    constructor(renderer, camera, sceneManager) {
        this.renderer = renderer;
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.scene = new THREE.Scene();
        
        // 이동 및 인터랙션 시스템
        this.keys = { w: false, a: false, s: false, d: false };
        this.moveSpeed = 0.1;
        this.wallPosterObject = null;  // 단일 오브젝트로 변경
        this.highlightedObject = null;
        this.originalMaterial = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 하이라이트 머티리얼
        this.highlightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.5 
        });
        
        this._initScene();
        this._createUI();
        this._loadOutdoorModel();
        this._setupEventListeners();
    }

    // --------------------------
    // 내부 초기화
    // --------------------------
    _initScene() {
        this.scene.fog = new THREE.Fog(0x111122, 10, 100);

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
        
        // 카메라 시작 위치 설정
        this.camera.position.set(110, 10, 140);
    }

    _createUI() {
        // 호버 라벨 - CSS 클래스 사용
        this.hoverLabel = document.createElement('div');
        this.hoverLabel.className = 'hover-label';
        document.body.appendChild(this.hoverLabel);

        // 선택지 모달 - CSS 클래스 사용
        this.modal = document.createElement('div');
        this.modal.className = 'choice-modal';
        document.body.appendChild(this.modal);
    }

    _loadOutdoorModel() {
        const loader = new GLTFLoader();
        
        // 파일 경로 확인 (debug-return-home.html과 index.html 모두에서 작동하도록)
        const possiblePaths = [
            './assets/outdoor.glb',      // debug-return-home.html에서
            '../assets/outdoor.glb',     // scripts 폴더에서
            'assets/outdoor.glb'         // 상대 경로
        ];
        
        // 첫 번째 경로로 시도
        this._tryLoadModel(loader, possiblePaths, 0);
    }
    
    _tryLoadModel(loader, paths, index) {
        if (index >= paths.length) {
            console.error('모든 경로에서 outdoor.glb 로딩 실패');
            console.log('=== Outdoor Model Loading Failed ===');
            console.log('Wall_Poster object found: NO');
            
            // UI 업데이트
            const modelStatus = document.getElementById('model-status');
            if (modelStatus) modelStatus.textContent = 'Model: Load Failed';
            return;
        }
        
        const currentPath = paths[index];
        console.log(`Trying to load outdoor.glb from: ${currentPath}`);
        
        // UI 업데이트
        const modelStatus = document.getElementById('model-status');
        if (modelStatus) modelStatus.textContent = `Model: Trying ${currentPath}`;
        
        loader.load(
            currentPath,
            (gltf) => {
                const model = gltf.scene;
                this.scene.add(model);
                console.log('=== Outdoor Model Loaded ===');
                console.log(`Successfully loaded from: ${currentPath}`);
                this._collectWallPosterObjects(model);
                console.log('Wall_Poster object found:', this.wallPosterObject ? 'YES' : 'NO');
                if (this.wallPosterObject) {
                    console.log('Wall_Poster name:', this.wallPosterObject.name);
                }
                
                // UI 업데이트
                if (modelStatus) modelStatus.textContent = 'Model: Loaded Successfully';
            },
            undefined,
            (error) => {
                console.warn(`Failed to load from ${currentPath}:`, error.message);
                // 다음 경로로 시도
                this._tryLoadModel(loader, paths, index + 1);
            }
        );
    }

    _collectWallPosterObjects(object, prefix = '') {
        if (object.name) {
            console.log(prefix + object.name);
            if (object.name.includes('Wall_Poster') && !this.wallPosterObject) {
                this.wallPosterObject = object;
                console.log(`✅ Found Wall_Poster: ${object.name}`);
            }
        }
        if (object.children && object.children.length > 0) {
            object.children.forEach(child => this._collectWallPosterObjects(child, prefix + '  '));
        }
    }

    _setupEventListeners() {
        // 키보드 이벤트
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
                const intersects = this.raycaster.intersectObject(this.wallPosterObject, true);
                
                if (intersects.length > 0) {
                    const obj = intersects[0].object;
                    
                    // 하이라이트 적용
                    this.highlightedObject = obj;
                    this.originalMaterial = obj.material;
                    obj.material = this.highlightMaterial;
                    
                    // 호버 라벨 표시
                    this.hoverLabel.textContent = "선거 벽보";
                    this.hoverLabel.style.left = event.clientX + 10 + 'px';
                    this.hoverLabel.style.top = event.clientY + 10 + 'px';
                    this.hoverLabel.style.display = 'block';
                    return;
                }
            }
            
            // Wall_Poster가 아닌 곳에 마우스가 있으면 라벨 숨김
            this.hoverLabel.style.display = 'none';
        };

        this.onMouseClick = (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            // Wall_Poster 오브젝트만 체크 (단일 오브젝트)
            if (this.wallPosterObject) {
                const intersects = this.raycaster.intersectObject(this.wallPosterObject, true);
                
                if (intersects.length > 0) {
                    this._showModal();
                }
            }
        };
    }

    _showModal() {
        this.modal.innerHTML = `
            <p>선거 벽보가 붙어있다! 내가 좋아하는 후보에게 왠지 하트를 마구마구 그려주고 싶다. 벽보에 하트를 그릴까?</p>
            <button id="draw-heart">하트를 큼직하게 그린다.</button>
            <button id="pass-by">그냥 지나간다.</button>
        `;
        this.modal.style.display = 'block';
        
        // 이벤트 리스너 등록
        document.getElementById('draw-heart').onclick = () => {
            this.modal.style.display = 'none';
            this.sceneManager.transitionTo('SceneHome');
        };
        
        document.getElementById('pass-by').onclick = () => {
            this.modal.style.display = 'none';
            this.sceneManager.transitionTo('SceneTVCount');
        };
    }

    _updateMovement() {
        const direction = new THREE.Vector3();
        
        if (this.keys.w) direction.z -= 1;
        if (this.keys.s) direction.z += 1;
        if (this.keys.a) direction.x -= 1;
        if (this.keys.d) direction.x += 1;
        
        if (direction.length() > 0) {
            direction.normalize();
            // 카메라의 현재 방향에 맞춰 이동
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            const right = new THREE.Vector3();
            right.crossVectors(cameraDirection, this.camera.up).normalize();
            
            const movement = new THREE.Vector3();
            movement.addScaledVector(cameraDirection, -direction.z * this.moveSpeed);
            movement.addScaledVector(right, direction.x * this.moveSpeed);
            movement.y = 0; // Y축 이동 제한
            
            this.camera.position.add(movement);
        }
    }

    // 씬 진입 시 호출
    onEnter() {
        // 카메라 초기 위치 설정
        this.camera.position.set(110, 10, 140);
        
        // 이벤트 리스너 등록
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('click', this.onMouseClick);
        
        // UI 초기 상태 설정
        this._hideAllUI();
    }

    // 씬 종료 시 호출
    onExit() {
        // 이벤트 리스너 해제
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('click', this.onMouseClick);
        
        // UI 정리 및 하이라이트 제거
        this._hideAllUI();
        this._clearHighlight();
    }

    // UI 상태 관리 헬퍼 메서드들
    _hideAllUI() {
        if (this.hoverLabel) this.hoverLabel.style.display = 'none';
        if (this.modal) this.modal.style.display = 'none';
    }

    _clearHighlight() {
        if (this.highlightedObject && this.originalMaterial) {
            this.highlightedObject.material = this.originalMaterial;
            this.highlightedObject = null;
            this.originalMaterial = null;
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
}

// window에 클래스 노출 (non-module 스크립트에서 접근 가능하도록)
window.SceneReturnHome = SceneReturnHome;