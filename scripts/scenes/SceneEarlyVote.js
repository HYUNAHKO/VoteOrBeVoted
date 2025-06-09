import * as THREE from 'three';
import { EnvModelLoader, CharacterModelLoader } from '../utils/processImport.js';

export default class SceneEarlyVote {
    constructor(renderer, camera, sceneManager) {
        this.renderer = renderer;
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.scene = new THREE.Scene();
        
        // 모델 로더들
        this.envModelLoader = new EnvModelLoader();
        this.characterModelLoader = new CharacterModelLoader();
        
        // 이동 및 인터랙션 시스템
        this.keys = { w: false, a: false, s: false, d: false };
        this.moveSpeed = 0.3;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 카메라 회전 시스템
        this.isRotating = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraRotation = { horizontal: 0, vertical: 0 }; // 현재 회전 각도
        this.rotationLimits = {
            horizontal: { min: -Math.PI / 3, max: Math.PI / 2 }, // ±60도
            vertical: { min: -Math.PI / 6, max: Math.PI / 3 }     // ±30도
        };
        this.rotationSpeed = 0.002;
        
        // 캐릭터 관리
        this.characters = new Map(); // 로드된 캐릭터들을 저장
        
        // 하이라이트 시스템
        this.highlightedObjects = []; // 하이라이트된 오브젝트들 (배열로 변경)
        this.originalMaterials = new Map(); // 원본 머티리얼들을 저장
        this.interactableObjects = []; // 상호작용 가능한 오브젝트들
        this.interactionDistance = 400; // 상호작용 가능한 최대 거리
        
        // 하이라이트 머티리얼
        this.highlightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.5 
        });
        
        this._initScene();
        this._createUI();
        this._loadEnvironmentAndCharacters();
        this._setupEventListeners();
    }

    // --------------------------
    // 내부 초기화
    // --------------------------
    _initScene() {
        // 기본 안개 설정
        this.scene.fog = new THREE.FogExp2(0x856d71, 0.01);
        
        // 기본 조명 설정
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);
        
        const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
        dirLight1.position.set(5, 10, 7);
        dirLight1.castShadow = true;
        this.scene.add(dirLight1);
        
        const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight2.position.set(-5, 5, -7);
        this.scene.add(dirLight2);
        
        // 카메라 시작 위치 설정
        this.camera.position.set(0, 5, 10);
        
        // 배경색 설정
        this.scene.background = new THREE.Color(0x87CEEB); // 하늘색
    }

    _createUI() {
        // 도움말 UI
        this.helpUI = document.createElement('div');
        this.helpUI.className = 'help-ui';
        this.helpUI.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            z-index: 1000;
        `;
        this.helpUI.innerHTML = `
            <h4>조작법</h4>
            <div>WASD: 이동</div>
            <div>마우스 좌클릭+드래그: 카메라 회전</div>
            <div>H: 씬 hierarchy 출력 (콘솔 확인)</div>
        `;
        document.body.appendChild(this.helpUI);
        
        // 호버 라벨 UI 추가
        this.hoverLabel = document.createElement('div');
        this.hoverLabel.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            pointer-events: none;
            z-index: 2000;
            display: none;
        `;
        document.body.appendChild(this.hoverLabel);
    }

    _loadEnvironmentAndCharacters() {
        // earlyVote.glb 환경 모델 로드
        const envPaths = [
            './assets/models/earlyVote.glb',
            '../assets/models/earlyVote.glb',
            'assets/models/earlyVote.glb'
        ];
        
        this.envModelLoader.loadEnvironmentModel(
            'earlyVote',
            envPaths,
            this.scene,
            (modelRoot) => {
                console.log('Early vote environment loaded successfully');
                
                // earlyVote.glb 모델 설정
                modelRoot.scale.set(3, 3, 3);
                modelRoot.rotation.y = Math.PI / 2; // 90도 회전
                
                // 환경 모델 로드 완료 후 캐릭터들 로드
                this._loadCharacters();
                
                // 상호작용 가능한 오브젝트들 찾기
                this._findInteractableObjects();
            },
            null,
            (error) => {
                console.error('Early vote environment loading failed:', error);
                // 환경 로드에 실패해도 캐릭터들은 로드
                this._loadCharacters();
            }
        );
    }

    _loadCharacters() {
        // 캐릭터 파일 목록과 각각의 transform 설정
        const characterConfigs = [
            {
                filename: 'char_male_standing.fbx',
                name: 'male_standing',
                position: { x: -3, y: 0, z: 2 },
                rotation: { x: 0, y: Math.PI / 8, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female_sitting2.fbx',
                name: 'female_sitting2',
                position: { x: 52, y: 0, z: 35 },
                rotation: { x: 0, y: -Math.PI / 2, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_male_sitting.fbx',
                name: 'male_sitting',
                position: { x: 52, y: 0, z: 25},
                rotation: { x: 0, y: - Math.PI / 2, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female_sitting.fbx',
                name: 'female_sitting',
                position: { x: -5, y: 0.6, z: 25 },
                rotation: { x: 0, y: Math.PI / 2, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female2_sitting.fbx',
                name: 'female2_sitting',
                position: { x: -7, y: -0.5, z: 34 },
                rotation: { x: 0, y: Math.PI / 2, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female2_standing.fbx',
                name: 'female2_standing',
                position: { x: 48, y: 0, z: 3 },
                rotation: { x: 0, y: - Math.PI / 8, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_elderfemale_sitting.fbx',
                name: 'elderfemale_sitting',
                position: { x: -5, y: 1, z: 12 },
                rotation: { x: 0, y: Math.PI / 2, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female2_sitting.fbx',
                name: 'female2_sitting2',
                position: { x: 53.5, y: -0.5, z: 12 },
                rotation: { x: 0, y: - Math.PI / 2, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female_sitting.fbx',
                name: 'female_sitting3',
                position: { x: 17, y: -0.2, z: 12 },
                rotation: { x: 0, y: Math.PI, z: 0 },
                scale: 0.1
            },
            {
                filename: 'char_female_sitting.fbx',
                name: 'female_sitting4',
                position: { x: 28, y: -0.2, z: 12 },
                rotation: { x: 0, y: Math.PI, z: 0 },
                scale: 0.1
            },
        ];

        // 각 캐릭터를 로드하고 하드코딩된 위치에 배치
        characterConfigs.forEach((config, index) => {
            const paths = [
                `./assets/characters/${config.filename}`,
                `../assets/characters/${config.filename}`,
                `assets/characters/${config.filename}`
            ];

            this.characterModelLoader.loadCharacter(
                config.name,
                paths,
                this.scene,
                false, // dummy = false
                (characterRoot) => {
                    console.log(`Character ${config.name} loaded successfully`);
                    
                    // 하드코딩된 위치, 회전, 크기 설정
                    characterRoot.position.set(config.position.x, config.position.y, config.position.z);
                    characterRoot.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
                    characterRoot.scale.setScalar(config.scale);
                    
                    // 캐릭터 정보 저장
                    this.characters.set(config.name, {
                        root: characterRoot,
                        config: config
                    });
                    
                    // 캐릭터 로드 완료 후 상호작용 가능한 오브젝트 다시 찾기 (SkinnedMesh 포함)
                    setTimeout(() => {
                        this._findInteractableObjects();
                    }, 100);
                },
                null,
                (error) => {
                    console.error(`Failed to load character ${config.name}:`, error);
                }
            );
        });
    }

    _findInteractableObjects() {
        // 씬에서 상호작용 가능한 오브젝트들을 찾아서 저장 (중복 방지)
        const targetPatterns = [
            'pollingBooth', 'electionBox', 'stamp', 'ballot'
        ];
        
        // 이전에 찾은 오브젝트들 초기화
        this.interactableObjects = [];
        
        this.scene.traverse((object) => {
            // 패턴에 맞는 오브젝트 찾기
            if (object.name) {
                const objectName = object.name.toLowerCase();
                for (const pattern of targetPatterns) {
                    if (objectName.includes(pattern.toLowerCase())) {
                        this.interactableObjects.push(object);
                        console.log(`Found interactable object: ${object.name}`);
                        break;
                    }
                }
            }
            
            // SkinnedMesh 타입의 캐릭터 메쉬들 찾기
            if (object.isSkinnedMesh) {
                this.interactableObjects.push(object);
                console.log(`Found character SkinnedMesh: ${object.name || 'unnamed'}`);
            }
        });
        
        console.log(`Total interactable objects found: ${this.interactableObjects.length}`);
    }

    _findTargetParent(object) {
        // 상호작용 대상 패턴들
        const targetPatterns = [
            'pollingBooth', 'electionBox', 'stamp', 'ballot'
        ];
        
        let current = object;
        
        // 부모를 따라 올라가면서 target pattern에 맞는 이름을 가진 오브젝트 찾기
        while (current) {
            if (current.name) {
                const objectName = current.name.toLowerCase();
                for (const pattern of targetPatterns) {
                    if (objectName.includes(pattern.toLowerCase())) {
                        return current; // 패턴에 맞는 부모 오브젝트 반환
                    }
                }
            }
            
            current = current.parent;
        }
        
        // 패턴에 맞는 부모를 찾지 못한 경우, SkinnedMesh라면 캐릭터 그룹의 최상위 부모를 찾기
        if (object.isSkinnedMesh) {
            return this._findCharacterRoot(object);
        }
        
        // 그 외의 경우 원래 오브젝트 반환
        return object;
    }

    _findCharacterRoot(skinnedMesh) {
        // SkinnedMesh에서 시작해서 캐릭터의 최상위 루트를 찾기
        let current = skinnedMesh;
        let characterRoot = skinnedMesh;
        
        // 부모를 따라 올라가면서 캐릭터 관련 오브젝트들의 공통 부모 찾기
        while (current && current.parent) {
            const parent = current.parent;
            
            // 부모가 씬이면 중단
            if (parent.type === 'Scene') {
                break;
            }
            
            // 부모 아래에 여러 SkinnedMesh가 있는지 확인 (캐릭터 + 악세사리)
            const skinnedMeshChildren = [];
            parent.traverse((child) => {
                if (child.isSkinnedMesh) {
                    skinnedMeshChildren.push(child);
                }
            });
            
            // 부모 아래에 2개 이상의 SkinnedMesh가 있으면 이것이 캐릭터 그룹의 루트
            if (skinnedMeshChildren.length >= 2) {
                characterRoot = parent;
                break;
            }
            
            current = parent;
        }
        
        console.log(`Found character root: ${characterRoot.name || 'unnamed'} for SkinnedMesh: ${skinnedMesh.name || 'unnamed'}`);
        return characterRoot;
    }

    _getAllMeshesInObject(object) {
        // 오브젝트 내의 모든 메쉬들을 찾아서 배열로 반환
        const meshes = [];
        
        object.traverse((child) => {
            if (child.isMesh || child.isSkinnedMesh) {
                meshes.push(child);
            }
        });
        
        return meshes;
    }

    _getDisplayName(objectName) {
        // 객체 이름을 사용자 친화적인 한국어로 변환
        if (!objectName || objectName === 'Unknown Object') {
            return '선거 안내원';
        }
        
        const name = objectName.toLowerCase();
        
        if (name.includes('pollingbooth')) {
            return '기표소';
        } else if (name.includes('ballot')) {
            return '투표 용지';
        } else if (name.includes('electionbox')) {
            return '투표함';
        } else if (name.includes('stamp')) {
            return '투표 도장';
        } else {
            // SkinnedMesh나 기타 캐릭터 관련 객체들
            return '선거 안내원';
        }
    }

    _setupEventListeners() {
        // 키보드 이벤트
        this.onKeyDown = (event) => {
            const key = event.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = true;
            }
            
            // H 키로 hierarchy 출력
            if (key === 'h') {
                this.envModelLoader.constructor.logSceneHierarchy(this.scene, 'Early Vote Scene Hierarchy');
            }
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
            
            // 호버 처리 (카메라 회전 중이 아닐 때만)
            this._handleHover(event);
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
            if (event.button === 0) { // 좌클릭
                this.isRotating = false;
            }
        };

        this.onContextMenu = (event) => {
            event.preventDefault(); // 우클릭 컨텍스트 메뉴 비활성화
        };

        this.onMouseClick = (event) => {
            // 카메라 회전 중이면 클릭 무시
            if (this.isRotating) return;
        };
    }

    _handleHover(event) {
        // 마우스 좌표를 normalized device coordinates로 변환
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 이전 하이라이트 제거
        this._clearHighlight();
        
        // 상호작용 가능한 오브젝트들 체크
        if (this.interactableObjects.length > 0) {
            const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);
            
            if (intersects.length > 0) {
                const intersectedObject = intersects[0].object;
                
                // 부모 오브젝트 찾기
                const targetParent = this._findTargetParent(intersectedObject);
                
                // 카메라와의 거리 체크 (부모 오브젝트 기준)
                const distance = this.camera.position.distanceTo(targetParent.position);
                
                if (distance <= this.interactionDistance) {
                    // 부모 오브젝트의 모든 메쉬들에 하이라이트 적용
                    this._applyHighlightToGroup(targetParent);
                    
                    // 호버 라벨 표시 (사용자 친화적인 이름으로 변환)
                    const rawObjectName = targetParent.name || 'Unknown Object';
                    const displayName = this._getDisplayName(rawObjectName);
                    this._showHoverLabel(event, displayName);
                    return;
                }
            }
        }
        
        // 호버 대상이 없으면 라벨 숨김
        this._hideHoverLabel();
    }

    _applyHighlightToGroup(parentObject) {
        // 부모 오브젝트의 모든 메쉬들을 찾아서 하이라이트 적용
        const meshes = this._getAllMeshesInObject(parentObject);
        
        meshes.forEach(mesh => {
            if (mesh.material && !this.originalMaterials.has(mesh)) {
                // 원본 머티리얼 저장
                this.originalMaterials.set(mesh, mesh.material);
                // 하이라이트 머티리얼 적용
                mesh.material = this.highlightMaterial;
                // 하이라이트된 오브젝트 목록에 추가
                this.highlightedObjects.push(mesh);
            }
        });
        
        console.log(`Applied highlight to ${meshes.length} meshes in ${parentObject.name || 'unnamed object'}`);
    }

    _clearHighlight() {
        // 모든 하이라이트된 오브젝트들의 원본 머티리얼 복원
        this.highlightedObjects.forEach(object => {
            const originalMaterial = this.originalMaterials.get(object);
            if (originalMaterial) {
                object.material = originalMaterial;
                this.originalMaterials.delete(object);
            }
        });
        
        // 배열 초기화
        this.highlightedObjects = [];
    }

    _showHoverLabel(event, text) {
        this.hoverLabel.textContent = text;
        this.hoverLabel.style.left = event.clientX + 10 + 'px';
        this.hoverLabel.style.top = event.clientY + 10 + 'px';
        this.hoverLabel.style.display = 'block';
    }

    _hideHoverLabel() {
        this.hoverLabel.style.display = 'none';
    }



    _updateMovement() {
        const direction = new THREE.Vector3();
        
        if (this.keys.w) direction.z += 1;  // W = 앞으로
        if (this.keys.s) direction.z -= 1;  // S = 뒤로
        if (this.keys.a) direction.x -= 1;  // A = 왼쪽
        if (this.keys.d) direction.x += 1;  // D = 오른쪽
        
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
            movement.addScaledVector(cameraDirection, direction.z * this.moveSpeed);  // 앞뒤
            movement.addScaledVector(right, direction.x * this.moveSpeed);           // 좌우
            movement.y = 0; // Y축 이동 제한
            
            this.camera.position.add(movement);
        }
    }

    _applyCameraRotation() {
        // 카메라의 현재 회전을 Euler 각도로 설정
        this.camera.rotation.set(
            this.cameraRotation.vertical,
            this.cameraRotation.horizontal,
            0,
            'YXZ' // Y축 먼저 회전(좌우), 그 다음 X축 회전(위아래)
        );
    }

    // 씬 진입 시 호출
    onEnter() {
        // 카메라 초기 위치 설정
        this.camera.position.set(12, 15, 65);
        this.cameraRotation.horizontal = 0;
        this.cameraRotation.vertical = 0;
        this._applyCameraRotation();
        
        // 이벤트 리스너 등록
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('click', this.onMouseClick);
        
        // UI 표시
        this.helpUI.style.display = 'block';
        
        // 씬 hierarchy 자동 출력 (3초 후 - 모델들이 로드된 후)
        setTimeout(() => {
            this.envModelLoader.constructor.logSceneHierarchy(this.scene, 'Early Vote Scene - Initial Hierarchy');
        }, 3000);
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
        
        // UI 숨김
        this.helpUI.style.display = 'none';
        
        // 하이라이트 및 호버 라벨 정리
        this._clearHighlight();
        this._hideHoverLabel();
    }

    // 매 프레임마다 호출
    update() {
        this._updateMovement();
        
        // 캐릭터 애니메이션 업데이트
        this.characterModelLoader.updateAllAnimations(0.016); // 대략 60fps
    }

    // 렌더링 (SceneManager에서 호출)
    render() {
        this.renderer.setClearColor(0x87CEEB);
    }
}

// window에 클래스 노출 (non-module 스크립트에서 접근 가능하도록)
window.SceneEarlyVote = SceneEarlyVote;
