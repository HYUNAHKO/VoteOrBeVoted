import * as THREE from 'three';
import { EnvModelLoader, CharacterModelLoader } from '../utils/processImport.js';
import CollisionControl from '../utils/collisionControl.js';
import { GameState } from '../utils/GameState.js';

export default class SceneEarlyVote {
    constructor(renderer, camera, sceneManager) {
        this.renderer = renderer;
        this.camera = camera;
        this.sceneManager = sceneManager;
        this.scene = new THREE.Scene();

        // 충돌 체크 시스템
        this.collisionControl = new CollisionControl(this.camera);
        this.collisionControl.setCollisionDistance(3.0);
        
        // 모델 로더들
        this.envModelLoader = new EnvModelLoader();
        this.characterModelLoader = new CharacterModelLoader();
        
        // 집 돌아가는 위치 및 상태
        this.returnHomePosition = new THREE.Vector3(37.57, 10, 88.56); // return home 위치 {x: 37.57, y: 10, z: 88.56}
        this.returnHomeShown   = false;

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
            horizontal: { min: -Infinity,    max: Infinity    }, // 카메라 회전 해제
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
            opacity: 0.9 
        });
        
        // 투표 용지 받았는지 여부
        this.ballotReceived = false;           // 투표 용지 받은 상태
        this.ballotSubmitted = false; // 투표 용지 제출 여부
        this.pollingBoothPositions = [        // 기표소 위치 리스트
            new THREE.Vector3(1.18, 15, -22.49),
            new THREE.Vector3(14.18,15, -22.4),
            new THREE.Vector3(33.12,15, -20.9),
            new THREE.Vector3(52.67,15, -20.83)
        ];

        // 투표함 위치 리스트
        this.electionBoxPositions = [
            new THREE.Vector3(16.63, 15, -4.09),
            new THREE.Vector3(28.4,  15, -3.93)
        ];
        this.selectedCandidate = null;
        
        // 투표용지 촬영 관련 속성 추가
        this.photoUIShown = false;          // 사진 촬영 UI 표시 여부
        this.phone = null;              // 핸드폰 든 손 3D 오브젝트
        this.photoTimer = null;             // 사진 촬영 유도 타이머
        this.voteConfirmShown = false;      // 투표 확인창 표시 여부 
        
        this._initScene();
        this._createUI();
        this._loadEnvironmentAndCharacters();
        this._setupEventListeners();
        this._createReturnHomeGlow();
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
        this.scene.background = new THREE.Color(0xC0C0C0); // 연한 회색

        // 핸드폰 든 손 생성 및 씬에 추가
        this.phone = this._createPhone();
        this.scene.add(this.phone);
    }


    // 핸드폰 3D 오브젝트 생성 
    _createPhone() {
        const phoneGroup = new THREE.Group();
        phoneGroup.name = 'PhoneGroup';
        
        // 핸드폰 본체 (세로로 세워진 형태)
        const phoneGeometry = new THREE.BoxGeometry(1.2, 2, 0.12); 
        const phoneMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1a1a1a,
            emissive: 0x111111,
            emissiveIntensity: 0.2
        });
        const phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
        phone.name = 'PhoneBody';
        phoneGroup.add(phone);
        
        // 화면
        const screenGeometry = new THREE.BoxGeometry(1.04, 1.76, 0.01);
        const screenMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xADD8E6,
            emissive: 0x4444FF,
            emissiveIntensity: 0.4
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.name = 'Screen';
        screen.position.set(0, 0, 0.065); // 핸드폰 앞면에 위치
        phoneGroup.add(screen);
        
        // 카메라 렌즈
        const lensGeometry = new THREE.CircleGeometry(0.06, 16);
        const lensMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        lens.position.set(0.28, 0.72, -0.065); // 뒷면 상단
        lens.rotation.x = Math.PI;
        phoneGroup.add(lens);
        
        // 홈 버튼
        const buttonGeometry = new THREE.CircleGeometry(0.08, 16);
        const buttonMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(0, -0.8, 0.065); // 앞면 하단
        phoneGroup.add(button);
        
        // 초기 위치 및 회전 설정
        phoneGroup.position.set(0, -10, 0); // 화면 아래 숨김
        phoneGroup.visible = false;
        
        return phoneGroup;
    }

    // 집 가는 부분 Glow 생성
    _createReturnHomeGlow() {

        const glowRadius = 5;  
        const glowGeo    = new THREE.SphereGeometry(glowRadius, 32, 32);
        const glowMat    = new THREE.MeshBasicMaterial({
            color:       0x00ff88,
            transparent: true,
            opacity:     0.8,             // 더 진하게 할 수도 있음요
            side:        THREE.DoubleSide
        });

        this.returnHomeGlow = new THREE.Mesh(glowGeo, glowMat);
        this.returnHomeGlow.position.copy(this.returnHomePosition);
        this.returnHomeGlow.scale.setScalar(1.5);  // 초기 스케일도 좀 키워줌
        this.scene.add(this.returnHomeGlow);
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

                this.collisionControl.addCollidableModel(modelRoot);
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

                    this.collisionControl.addCollidableModel(characterRoot);

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
            if (this.isRotating) return;
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const hits = this.raycaster.intersectObjects(this.interactableObjects, true);
            if (hits.length === 0) return;

            const target = this._findTargetParent(hits[0].object);
            const type   = this._getObjectType(target.name || '');

            // 선거 안내원 or 투표 용지 클릭 -> 투표 용지 받기
            if (type === 'character' || type === 'ballot') {
                this._receiveBallot();
            }
            // 투표함 클릭 -> _submitVote 호출
            else if (type === 'box') {
                if (!this.selectedCandidate) {
                    this._showCustomAlert('먼저 기표소에서 후보를 선택하세요.');
                } else {
                    this._submitVote();
                }
            }
        };
    }

    _submitVote() {
        if (this.ballotSubmitted) return;
        console.log(`✅ 최종 투표: ${this.selectedCandidate}`);
        this._showCustomAlert(`투표함에 ${this.selectedCandidate} 후보로 투표되었습니다!`);
        this.ballotSubmitted = true;
    }
    
    _getObjectType(objectName) {
        const name = (objectName || '').toLowerCase();
        if (name.includes('pollingbooth')) return 'booth';
        if (name.includes('electionbox'))   return 'box';
        if (name.includes('ballot'))        return 'ballot';
        if (name.includes('stamp'))         return 'stamp';
        return 'character';
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
                    
                    // 호버된 오브젝트 정보 저장 및 콘솔 출력
                    this._logHoveredObject(targetParent, displayName, distance);
                    
                    return;
                }
            }
        }
        
        // 호버 대상이 없으면 라벨 숨김 및 현재 호버 오브젝트 초기화
        this._hideHoverLabel();
        this.currentHoveredObject = null;
    }

    _logHoveredObject(targetObject, displayName, distance) {
        // 현재 호버 중인 오브젝트가 변경된 경우에만 로깅
        if (this.currentHoveredObject !== targetObject) {
            this.currentHoveredObject = targetObject;
            
            // 콘솔에 호버된 오브젝트 정보 출력
            console.log('=== HOVERED OBJECT ===');
            console.log(`Display Name: ${displayName}`);
            console.log(`Object Name: ${targetObject.name || 'unnamed'}`);
            console.log(`Object Type: ${targetObject.constructor.name}`);
            console.log(`Distance: ${distance.toFixed(2)}`);
            console.log(`Position:`, targetObject.position);
            console.log(`Object:`, targetObject);
            console.log('======================');
        }
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
            
            // 충돌 체크 후 이동
            if (this.collisionControl.preventCollision(movement)) {
                this.camera.position.add(movement);
            }
        }
    }

    _receiveBallot() {
        if (this.ballotReceived) return;

        console.log('🗳️ 투표 용지를 받았습니다!');
        this._showCustomAlert('🗳️ 투표 용지를 받았습니다!<br>기표소로 가서 투표하세요.');
        this.ballotReceived = true;  
    }

    _showVoteConfirmUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            background:'rgba(0,0,0,0.8)', color:'#fff',
            padding:'20px', borderRadius:'8px', zIndex:'2000'
        });
        container.id = 'vote-confirm';
        container.innerHTML = `
            <p>🗳️ 기표소에 도착했습니다. 투표하시겠습니까?</p>
            <button id="vote-yes">예</button>
            <button id="vote-no">아니오</button>
        `;
        document.body.appendChild(container);

        container.querySelector('#vote-yes').onclick = () => {
            document.body.removeChild(container);
            this._showBallotUI();
        };
        container.querySelector('#vote-no').onclick = () => {
            document.body.removeChild(container);
            this.voteConfirmShown = false;
        };
    }

    _showBallotUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            color: '#000',
            padding: '30px',
            borderRadius: '12px',
            zIndex: '2000',
            width: '360px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            fontSize: '18px',
            textAlign: 'center',
        });
        container.id = 'vote-ballot';
        container.innerHTML = `
            <h2 style="margin-bottom:20px; font-size:24px;">🗳️ 투표 용지</h2>
            <div style="margin-bottom:20px; text-align:left;">
            <label style="display:block; margin-bottom:10px; font-size:18px;">
                <input type="radio" name="cand" value="Phong" style="transform:scale(1.2); margin-right:8px;">
                Phong
            </label>
            <label style="display:block; margin-bottom:10px; font-size:18px;">
                <input type="radio" name="cand" value="이인권" style="transform:scale(1.2); margin-right:8px;">
                이인권
            </label>
            <label style="display:block; margin-bottom:20px; font-size:18px;">
                <input type="radio" name="cand" value="Catmull" style="transform:scale(1.2); margin-right:8px;">
                Catmull
            </label>
            </div>
            <button id="ballot-submit" style="
            width:100%;
            padding:12px 0;
            font-size:18px;
            font-weight:bold;
            background:#3498db;
            color:#fff;
            border:none;
            border-radius:6px;
            cursor:pointer;
            ">제출</button>
        `;
        document.body.appendChild(container);

        // 투표 용지 UI가 표시된 3초 후 사진 촬영 유도
        this.photoTimer = setTimeout(() => {
            if (document.getElementById('vote-ballot') && !this.photoUIShown) {
                this._showPhotoPromptUI();
            }
        }, 1000);

        container.querySelector('#ballot-submit').onclick = () => {
        const sel = container.querySelector('input[name="cand"]:checked');
        if (!sel) {
            this._showCustomAlert('후보를 선택해주세요.');
            return;
        }
        GameState.selectedCandidate = sel.value;
        this.selectedCandidate = sel.value;
        this._showCustomAlert(`투표 용지에 ${sel.value} 선택 완료!\n투표함으로 이동하세요.`);

        // 투표 용지 제출 시 사진 촬영 관련 UI 
        this._clearPhotoUI();

        document.body.removeChild(container);
        };
    }

    _showCustomAlert(message, buttonText = '확인', callback = null) {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            padding: '20px 30px',
            borderRadius: '12px',
            zIndex: '2500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            fontSize: '18px',
            textAlign: 'center',
            maxWidth: '400px',
            minWidth: '300px'
        });
        container.className = 'custom-alert';
        container.innerHTML = `
            <p style="margin-bottom: 20px; line-height: 1.5;">
                ${message}
            </p>
            <button style="
                padding: 12px 24px;
                font-size: 18px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            ">${buttonText}</button>
        `;
        
        document.body.appendChild(container);
        
        const button = container.querySelector('button');
        button.onclick = () => {
            document.body.removeChild(container);
            if (callback) callback();
        };
        
        // 호버 효과
        button.onmouseover = () => {
            button.style.background = '#2980b9';
            button.style.transform = 'scale(1.05)';
        };
        button.onmouseout = () => {
            button.style.background = '#3498db';
            button.style.transform = 'scale(1)';
        };
    }

    // 사진 촬영 유도 UI 표시 메서드 추가
    _showPhotoPromptUI() {
        if (this.photoUIShown) return;
        
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            padding: '20px 30px',
            borderRadius: '12px',
            zIndex: '2001',  // 투표 용지 UI보다 위에 표시
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            fontSize: '18px',
            textAlign: 'center',
            maxWidth: '400px'
        });
        container.id = 'photo-prompt';
        container.innerHTML = `
            <p style="margin-bottom: 20px;">
                아~ 투표한 거 자랑하고 싶네~<br>
                사진이나 찍을까? 📱
            </p>
            <button id="photo-button" style="
                padding: 12px 24px;
                font-size: 20px;
                background: #FF6B6B;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
            ">📸 찰칵!</button>
        `;
        
        document.body.appendChild(container);
        this.photoUIShown = true;
        
        // 핸드폰 든 손 애니메이션 시작
        this._animatePhone();
        
        // 버튼 클릭 이벤트
        container.querySelector('#photo-button').onclick = () => {
            this._onPhotoAttempt();
        };
        
        // 버튼 호버 효과
        const button = container.querySelector('#photo-button');
        button.onmouseover = () => {
            button.style.background = '#FF5252';
            button.style.transform = 'scale(1.05)';
        };
        button.onmouseout = () => {
            button.style.background = '#FF6B6B';
            button.style.transform = 'scale(1)';
        };
    }

    // 핸드폰 든 손 애니메이션 메서드 추가
    _animatePhone() {
        if (!this.phone) {
            console.error('❌ phone is null!');
            return;
        }
        
        this.phone.visible = true;
        let animationFrame;
        let animationStartTime = Date.now();
        
        const updatePhonePosition = () => {
            if (!this.phone.visible) {
                cancelAnimationFrame(animationFrame);
                return;
            }
            
            const elapsed = Date.now() - animationStartTime;
            const animationDuration = 1000; // 1초 동안 올라오는 애니메이션
            
            // 카메라 앞쪽에 위치 설정
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            // 카메라 앞 5 유닛, 약간 오른쪽으로
            const distance = 4;
            const rightOffset = 2;
            const basePosition = this.camera.position.clone();
            basePosition.add(cameraDirection.multiplyScalar(distance));
            
            // 오른쪽으로 이동
            const right = new THREE.Vector3();
            right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
            basePosition.add(right.multiplyScalar(rightOffset));
            
            this.phone.position.x = basePosition.x;
            this.phone.position.z = basePosition.z;
            
            // Y 위치 애니메이션 (아래에서 위로)
            if (elapsed < animationDuration) {
                const progress = elapsed / animationDuration;
                const easeOut = 1 - Math.pow(1 - progress, 3); // ease-out 효과
                this.phone.position.y = this.camera.position.y - 5 + (easeOut * 3);
            } else {
                this.phone.position.y = this.camera.position.y - 2;
            }
            
            // 카메라를 향해 회전 (세로 방향 유지)
            this.phone.lookAt(this.camera.position);
            this.phone.rotation.z = 0; // Z축 회전 제거 (세로 유지)
            
            // 약간의 흔들림 효과
            const time = Date.now() * 0.001;
            this.phone.rotation.y += Math.sin(time * 2) * 0.02;
            this.phone.rotation.x = Math.sin(time * 1.5) * 0.01;
            
            animationFrame = requestAnimationFrame(updatePhonePosition);
        };
        
        updatePhonePosition();
    }

    // 사진 촬영 시도 시 처리 메서드 추가
    _onPhotoAttempt() {
        // 경고 메시지 표시
        this._showCustomAlert('⚠️ 투표소 내 촬영은 금지되어 있습니다!\n선거법 위반으로 처벌받을 수 있습니다.');

        // 모든 UI 제거
        this._clearPhotoUI();
        const ballotUI = document.getElementById('vote-ballot');
        if (ballotUI) ballotUI.remove();
        
        // 씬 강제 종료 (홈 씬으로 전환)
        setTimeout(() => {
            console.log('📸 촬영 시도로 인한 씬 종료');
            this.ballotReceived = false;  
            this.voteConfirmShown = false;
            this.sceneManager.transitionTo('home');
        }, 2000);
    }

    // 사진 촬영 관련 UI 정리 메서드 추가
    _clearPhotoUI() {
        // 타이머 취소
        if (this.photoTimer) {
            clearTimeout(this.photoTimer);
            this.photoTimer = null;
        }
        
        // UI 제거
        const promptUI = document.getElementById('photo-prompt');
        if (promptUI) promptUI.remove();
        this.photoUIShown = false;
        
        // 핸드폰 숨기기
        if (this.phone) {
            this.phone.visible = false;
        }
    }
    _showReturnHomeUI() {
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            background:'rgba(0,0,0,0.8)', color:'#fff',
            padding:'20px', borderRadius:'8px', zIndex:'2000'
        });
        container.id = 'return-home-confirm';
        container.innerHTML = `
            <p>🏠 집으로 돌아가시겠습니까?</p>
            <button id="return-yes">예</button>
            <button id="return-no">아니오</button>
        `;
        document.body.appendChild(container);

        container.querySelector('#return-yes').onclick = () => {
            document.body.removeChild(container);
            this.sceneManager.transitionTo('returnHome');
        };
        container.querySelector('#return-no').onclick = () => {
            document.body.removeChild(container);
        };
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
        
        // UI를 DOM에 추가
        document.body.appendChild(this.helpUI);
        document.body.appendChild(this.hoverLabel);
        
        // 이벤트 리스너 등록
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('click', this.onMouseClick);
        
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
        
        // UI를 DOM에서 제거
        if (this.helpUI.parentNode) {
            this.helpUI.parentNode.removeChild(this.helpUI);
        }
        if (this.hoverLabel.parentNode) {
            this.hoverLabel.parentNode.removeChild(this.hoverLabel);
        }
        
        // 하이라이트 및 호버 라벨 정리
        this._clearHighlight();
        this._hideHoverLabel();

        // 사진 촬영 UI 정리
        this._clearPhotoUI();
    }

    // 매 프레임마다 호출
    update() {
        this._updateMovement();
        
        if (Date.now() % 500 < 16) {
            console.log('🚶 현재 위치:', {
                x: Math.round(this.camera.position.x * 100) / 100,
                y: Math.round(this.camera.position.y * 100) / 100,
                z: Math.round(this.camera.position.z * 100) / 100
            });
        }
        // 캐릭터 애니메이션 업데이트
        this.characterModelLoader.updateAllAnimations(0.016); // 대략 60fps

        // 투표 용지 받은 뒤, 기표소 근처에 가면 확인창 띄우기 
        if (this.ballotReceived && !this.voteConfirmShown) {
            const camPos = this.camera.position;
            for (const boothPos of this.pollingBoothPositions) {
            if (camPos.distanceTo(boothPos) < 5) {      // 거리 임계값(5) 이하이면
                this._showVoteConfirmUI();
                this.voteConfirmShown = true;             // 한 번만 띄우기
                break;
            }
            }
        }

        if (this.ballotSubmitted && !this.returnHomeShown) {
            const camPos = this.camera.position;
            const dx = camPos.x - this.returnHomePosition.x;
            const dz = camPos.z - this.returnHomePosition.z;
            if (Math.hypot(dx, dz) < 5) {
                this._showReturnHomeUI();
                this.returnHomeShown = true;
            }
        }


        if (this.returnHomeGlow) {
            const t = Date.now() * 0.002;
            // 투명도 펄스
            this.returnHomeGlow.material.opacity = 0.1 + Math.sin(t * 3) * 0.1;
            // 스케일 펄스
            const s = 1.0 + Math.sin(t * 3) * 0.2;
            this.returnHomeGlow.scale.setScalar(s);
        }
    }

    // 렌더링 (SceneManager에서 호출)
    render() {
        this.renderer.setClearColor(0x87CEEB);
    }
}

// window에 클래스 노출 (non-module 스크립트에서 접근 가능하도록)
window.SceneEarlyVote = SceneEarlyVote;
