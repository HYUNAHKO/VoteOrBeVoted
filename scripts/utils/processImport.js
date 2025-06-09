import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * 환경 GLTF 모델을 로드하고 특정 오브젝트를 찾는 유틸리티 클래스
 */
export class EnvModelLoader {
    constructor() {
        this.loader = new GLTFLoader();
        this.loadedModels = new Map(); // 로드된 모델들을 추적
    }

    /**
     * 환경 모델을 로드 (단순히 모델만 로드하고 씬에 추가)
     * @param {string} modelName - 모델 식별자 (예: 'outdoor', 'indoor' 등)
     * @param {string[]} possiblePaths - 시도할 파일 경로들
     * @param {THREE.Scene} scene - 모델을 추가할 씬
     * @param {Function} onSuccess - 성공 콜백 (modelRoot를 매개변수로 받음)
     * @param {Function} onProgress - 진행 상황 콜백 (optional)
     * @param {Function} onError - 에러 콜백 (optional)
     */
    loadEnvironmentModel(modelName, possiblePaths, scene, onSuccess, onProgress = null, onError = null) {
        // 첫 번째 경로로 시도
        this._tryLoadModel(modelName, possiblePaths, 0, scene, onSuccess, onProgress, onError);
    }

    /**
     * 여러 경로를 시도하여 모델을 로드
     * @private
     */
    _tryLoadModel(modelName, paths, index, scene, onSuccess, onProgress, onError) {
        if (index >= paths.length) {
            const error = new Error(`모든 경로에서 ${modelName} 모델 로딩 실패`);
            console.error(error.message);
            console.log(`=== ${modelName} Model Loading Failed ===`);
            
            // UI 업데이트
            const modelStatus = document.getElementById('model-status');
            if (modelStatus) modelStatus.textContent = `Model: ${modelName} Load Failed`;
            
            if (onError) onError(error);
            return;
        }
        
        const currentPath = paths[index];
        console.log(`Trying to load ${modelName} model from: ${currentPath}`);
        
        // UI 업데이트
        const modelStatus = document.getElementById('model-status');
        if (modelStatus) modelStatus.textContent = `Model: Trying ${currentPath}`;
        
        this.loader.load(
            currentPath,
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);
                
                // 로드된 모델 정보 저장
                this.loadedModels.set(modelName, {
                    root: model,
                    path: currentPath,
                    scene: scene
                });
                
                console.log(`=== ${modelName} Model Loaded ===`);
                console.log(`Successfully loaded from: ${currentPath}`);
                
                // 모델 구조 로깅
                this._logModelStructure(model);
                
                // UI 업데이트
                if (modelStatus) modelStatus.textContent = `Model: ${modelName} Loaded Successfully`;
                
                if (onSuccess) onSuccess(model);
            },
            onProgress,
            (error) => {
                console.warn(`Failed to load from ${currentPath}:`, error.message);
                // 다음 경로로 시도
                this._tryLoadModel(modelName, paths, index + 1, scene, onSuccess, onProgress, onError);
            }
        );
    }

    /**
     * 로드된 모델에서 특정 이름의 오브젝트를 찾아 반환 (첫 번째만)
     * @param {string} modelName - 모델 식별자
     * @param {string} objectName - 찾을 오브젝트 이름 (부분 일치)
     * @returns {THREE.Object3D|null} 찾은 오브젝트 또는 null
     */
    findObjectInModel(modelName, objectName) {
        const modelInfo = this.loadedModels.get(modelName);
        if (!modelInfo) {
            console.warn(`Model '${modelName}' not found in loaded models`);
            return null;
        }

        const found = this._findFirstObjectByName(modelInfo.root, objectName);
        console.log(`Object '${objectName}' in model '${modelName}':`, found ? 'FOUND' : 'NOT FOUND');
        if (found) {
            console.log(`✅ Found object: ${found.name}`);
        }
        
        return found;
    }

    /**
     * 로드된 모델에서 특정 이름의 오브젝트들을 모두 찾아 반환
     * @param {string} modelName - 모델 식별자
     * @param {string} objectName - 찾을 오브젝트 이름 (부분 일치)
     * @returns {THREE.Object3D[]} 찾은 오브젝트들의 배열
     */
    findObjectsInModel(modelName, objectName) {
        const modelInfo = this.loadedModels.get(modelName);
        if (!modelInfo) {
            console.warn(`Model '${modelName}' not found in loaded models`);
            return [];
        }

        const found = this._findAllObjectsByName(modelInfo.root, objectName);
        console.log(`Objects '${objectName}' in model '${modelName}': ${found.length} found`);
        found.forEach((obj, index) => {
            console.log(`✅ Found object ${index + 1}: ${obj.name}`);
        });
        
        return found;
    }

    /**
     * 특정 모델 루트에서 첫 번째 일치하는 오브젝트를 찾음
     * @param {THREE.Object3D} root - 검색할 루트 오브젝트
     * @param {string} objectName - 찾을 오브젝트 이름 (부분 일치)
     * @returns {THREE.Object3D|null} 찾은 오브젝트 또는 null
     */
    findObjectInRoot(root, objectName) {
        return this._findFirstObjectByName(root, objectName);
    }

    /**
     * 특정 모델 루트에서 모든 일치하는 오브젝트들을 찾음
     * @param {THREE.Object3D} root - 검색할 루트 오브젝트
     * @param {string} objectName - 찾을 오브젝트 이름 (부분 일치)
     * @returns {THREE.Object3D[]} 찾은 오브젝트들의 배열
     */
    findObjectsInRoot(root, objectName) {
        return this._findAllObjectsByName(root, objectName);
    }

    /**
     * 로드된 모델 정보 가져오기
     * @param {string} modelName - 모델 식별자
     * @returns {Object|null} 모델 정보 또는 null
     */
    getModelInfo(modelName) {
        return this.loadedModels.get(modelName) || null;
    }

    /**
     * 로드된 모든 모델 목록 가져오기
     * @returns {string[]} 모델 이름들의 배열
     */
    getLoadedModelNames() {
        return Array.from(this.loadedModels.keys());
    }

    /**
     * 첫 번째 일치하는 오브젝트를 찾는 내부 메서드
     * @private
     */
    _findFirstObjectByName(object, targetName, prefix = '') {
        if (object.name) {
            console.log(prefix + object.name);
            if (object.name.includes(targetName)) {
                return object;
            }
        }
        
        if (object.children && object.children.length > 0) {
            for (const child of object.children) {
                const found = this._findFirstObjectByName(child, targetName, prefix + '  ');
                if (found) {
                    return found;
                }
            }
        }
        
        return null;
    }

    /**
     * 모든 일치하는 오브젝트들을 찾는 내부 메서드
     * @private
     */
    _findAllObjectsByName(object, targetName) {
        const foundObjects = [];
        
        const traverse = (obj) => {
            if (obj.name && obj.name.includes(targetName)) {
                foundObjects.push(obj);
            }
            
            if (obj.children && obj.children.length > 0) {
                obj.children.forEach(traverse);
            }
        };
        
        traverse(object);
        return foundObjects;
    }

    /**
     * 모델 구조를 로깅하는 내부 메서드
     * @private
     */
    _logModelStructure(object, prefix = '') {
        if (object.name) {
            console.log(prefix + object.name);
        }
        if (object.children && object.children.length > 0) {
            object.children.forEach(child => this._logModelStructure(child, prefix + '  '));
        }
    }

    /**
     * 씬의 전체 hierarchy를 콘솔에 출력
     * @param {THREE.Scene} scene - 출력할 씬
     * @param {string} title - 출력 제목 (optional)
     */
    static logSceneHierarchy(scene, title = 'Scene Hierarchy') {
        console.log(`\n=== ${title} ===`);
        console.log(`Scene contains ${scene.children.length} top-level objects:`);
        
        const logObject = (object, level = 0) => {
            const indent = '  '.repeat(level);
            const objectType = object.constructor.name;
            const name = object.name || '(unnamed)';
            
            let info = `${indent}${objectType}: "${name}"`;
            
            // 추가 정보 표시
            if (object.position) {
                const pos = object.position;
                info += ` pos:(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`;
            }
            
            if (object.isMesh) {
                const geometry = object.geometry;
                const material = object.material;
                info += ` [Mesh: ${geometry.constructor.name}, ${material.constructor.name}]`;
            } else if (object.isLight) {
                info += ` [Light: intensity=${object.intensity}]`;
            } else if (object.isCamera) {
                info += ` [Camera]`;
            }
            
            console.log(info);
            
            // 자식 객체들 재귀적으로 출력
            if (object.children && object.children.length > 0) {
                object.children.forEach(child => logObject(child, level + 1));
            }
        };
        
        scene.children.forEach(child => logObject(child, 0));
        console.log(`=== End of ${title} ===\n`);
    }
}

//============================================================================
// FBX 캐릭터 모델 로더 클래스
//============================================================================

/**
 * FBX 캐릭터 모델을 로드하고 텍스처를 적용하는 유틸리티 클래스
 */
export class CharacterModelLoader {
    constructor() {
        this.fbxLoader = new FBXLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.loadedCharacters = new Map(); // 로드된 캐릭터들을 추적
        
        // people_pal_ 텍스처 목록 (실제 파일명에 맞게 조정 필요)
        this.peopleTextures = [
            'people_pal_s4.png',
            'people_pal_s9.png',
            'people_pal_s10.png',
            'people_pal_s13.png'
        ];
    }

    /**
     * FBX 캐릭터 모델을 로드하고 텍스처를 적용
     * @param {string} characterName - 캐릭터 식별자
     * @param {string[]} possiblePaths - 시도할 FBX 파일 경로들
     * @param {THREE.Scene} scene - 캐릭터를 추가할 씬
     * @param {boolean} dummy - true면 더미 텍스처, false면 일반 텍스처
     * @param {Function} onSuccess - 성공 콜백 (character, mixer를 매개변수로 받음)
     * @param {Function} onProgress - 진행 상황 콜백 (optional)
     * @param {Function} onError - 에러 콜백 (optional)
     */
    loadCharacter(characterName, possiblePaths, scene, dummy = false, onSuccess, onProgress = null, onError = null) {
        this._tryLoadCharacter(characterName, possiblePaths, 0, scene, dummy, onSuccess, onProgress, onError);
    }

    /**
     * 여러 경로를 시도하여 FBX 캐릭터를 로드
     * @private
     */
    _tryLoadCharacter(characterName, paths, index, scene, dummy, onSuccess, onProgress, onError) {
        if (index >= paths.length) {
            const error = new Error(`모든 경로에서 ${characterName} 캐릭터 로딩 실패`);
            console.error(error.message);
            console.log(`=== ${characterName} Character Loading Failed ===`);
            
            if (onError) onError(error);
            return;
        }
        
        const currentPath = paths[index];
        console.log(`Trying to load ${characterName} character from: ${currentPath}`);
        
        this.fbxLoader.load(
            currentPath,
            (fbx) => {
                console.log(`=== ${characterName} Character Loaded ===`);
                console.log(`Successfully loaded from: ${currentPath}`);
                
                // 애니메이션 믹서 생성
                const mixer = new THREE.AnimationMixer(fbx);
                
                // 애니메이션 클립들 등록
                if (fbx.animations && fbx.animations.length > 0) {
                    console.log(`Found ${fbx.animations.length} animations:`);
                    fbx.animations.forEach((clip, index) => {
                        console.log(`  Animation ${index}: ${clip.name} (${clip.duration.toFixed(2)}s)`);
                    });
                }
                
                // 텍스처 적용
                this._applyTexture(fbx, dummy, () => {
                    // 씬에 캐릭터 추가
                    scene.add(fbx);
                    
                    // 로드된 캐릭터 정보 저장
                    this.loadedCharacters.set(characterName, {
                        model: fbx,
                        mixer: mixer,
                        animations: fbx.animations || [],
                        path: currentPath,
                        scene: scene,
                        dummy: dummy
                    });
                    
                    // mixamo.com 애니메이션 자동 재생
                    this._autoPlayMixamoAnimation(characterName);
                    
                    console.log(`✅ Character ${characterName} setup complete`);
                    
                    if (onSuccess) onSuccess(fbx, mixer);
                });
            },
            onProgress,
            (error) => {
                console.warn(`Failed to load from ${currentPath}:`, error.message);
                // 다음 경로로 시도
                this._tryLoadCharacter(characterName, paths, index + 1, scene, dummy, onSuccess, onProgress, onError);
            }
        );
    }

    /**
     * 캐릭터에 텍스처를 적용
     * @private
     */
    _applyTexture(fbx, dummy, onComplete) {
        let textureFileName;
        
        if (dummy) {
            // 더미 텍스처 사용
            textureFileName = 'DummyProp_bluep.png';
        } else {
            // people_pal_ 텍스처 중 랜덤 선택
            const randomIndex = Math.floor(Math.random() * this.peopleTextures.length);
            textureFileName = this.peopleTextures[randomIndex];
        }
        
        // 여러 가능한 텍스처 경로 생성
        const possibleTexturePaths = [
            `./assets/textures/${textureFileName}`,      // 현재 디렉토리에서
            `../assets/textures/${textureFileName}`,     // scripts에서 assets로
            `../../assets/textures/${textureFileName}`,  // utils에서 assets로
            `assets/textures/${textureFileName}`,        // 상대 경로
            `./textures/${textureFileName}`,             // textures 폴더만
            `../textures/${textureFileName}`,            // 상위에서 textures로
            `../../textures/${textureFileName}`          // 더 상위에서 textures로
        ];
        
        console.log(`Applying texture: ${textureFileName}`);
        console.log('Trying texture paths:', possibleTexturePaths);
        
        // 첫 번째 경로부터 시도
        this._tryLoadTexture(fbx, possibleTexturePaths, 0, onComplete);
    }

    /**
     * 여러 경로를 시도하여 텍스처를 로드
     * @private
     */
    _tryLoadTexture(fbx, paths, index, onComplete) {
        if (index >= paths.length) {
            console.warn('모든 텍스처 경로에서 로딩 실패, 기본 머티리얼 사용');
            // 텍스처 없이 기본 머티리얼 적용
            fbx.traverse((child) => {
                if (child.isMesh) {
                    const material = child.material.clone() || new THREE.MeshLambertMaterial();
                    material.color = new THREE.Color(0x888888); // 회색으로 설정
                    child.material = material;
                    console.log(`✅ Default material applied to mesh: ${child.name}`);
                }
            });
            if (onComplete) onComplete();
            return;
        }
        
        const currentPath = paths[index];
        console.log(`Trying texture path: ${currentPath}`);
        
        // 텍스처 로드 시도
        this.textureLoader.load(
            currentPath,
            (texture) => {
                // 텍스처 설정
                texture.flipY = true; // FBX 모델에 맞게 설정
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                
                // 캐릭터의 모든 메시에 텍스처 적용
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        // 기존 머티리얼 복사하거나 새로 생성
                        const material = child.material.clone() || new THREE.MeshLambertMaterial();
                        material.map = texture;
                        material.needsUpdate = true;
                        child.material = material;
                        
                        console.log(`✅ Texture applied to mesh: ${child.name}`);
                    }
                });
                
                console.log(`✅ Texture ${currentPath} applied successfully`);
                if (onComplete) onComplete();
            },
            undefined,
            (error) => {
                console.warn(`Failed to load texture from ${currentPath}:`, error.message || error);
                // 다음 경로로 시도
                this._tryLoadTexture(fbx, paths, index + 1, onComplete);
            }
        );
    }

    /**
     * 로드된 캐릭터 정보 가져오기
     * @param {string} characterName - 캐릭터 식별자
     * @returns {Object|null} 캐릭터 정보 또는 null
     */
    getCharacterInfo(characterName) {
        return this.loadedCharacters.get(characterName) || null;
    }

    /**
     * 캐릭터의 애니메이션 재생
     * @param {string} characterName - 캐릭터 식별자
     * @param {number} animationIndex - 재생할 애니메이션 인덱스 (default: 0)
     * @returns {THREE.AnimationAction|null} 애니메이션 액션 또는 null
     */
    playAnimation(characterName, animationIndex = 0) {
        const characterInfo = this.loadedCharacters.get(characterName);
        if (!characterInfo) {
            console.warn(`Character '${characterName}' not found`);
            return null;
        }

        if (!characterInfo.animations || characterInfo.animations.length === 0) {
            console.warn(`No animations found for character '${characterName}'`);
            return null;
        }

        if (animationIndex >= characterInfo.animations.length) {
            console.warn(`Animation index ${animationIndex} out of range for character '${characterName}'`);
            return null;
        }

        const clip = characterInfo.animations[animationIndex];
        const action = characterInfo.mixer.clipAction(clip);
        action.play();
        
        console.log(`✅ Playing animation '${clip.name}' for character '${characterName}'`);
        return action;
    }

    /**
     * 캐릭터의 애니메이션 믹서 업데이트 (매 프레임마다 호출 필요)
     * @param {string} characterName - 캐릭터 식별자
     * @param {number} deltaTime - 델타 타임
     */
    updateAnimation(characterName, deltaTime) {
        const characterInfo = this.loadedCharacters.get(characterName);
        if (characterInfo && characterInfo.mixer) {
            characterInfo.mixer.update(deltaTime);
        }
    }

    /**
     * 모든 로드된 캐릭터의 애니메이션 업데이트
     * @param {number} deltaTime - 델타 타임
     */
    updateAllAnimations(deltaTime) {
        this.loadedCharacters.forEach((characterInfo, characterName) => {
            if (characterInfo.mixer) {
                characterInfo.mixer.update(deltaTime);
            }
        });
    }

    /**
     * 로드된 모든 캐릭터 목록 가져오기
     * @returns {string[]} 캐릭터 이름들의 배열
     */
    getLoadedCharacterNames() {
        return Array.from(this.loadedCharacters.keys());
    }

    /**
     * people_pal_ 텍스처 목록 업데이트 (실제 파일에 맞게 조정)
     * @param {string[]} textureNames - 텍스처 파일명들
     */
    updatePeopleTextures(textureNames) {
        this.peopleTextures = textureNames;
        console.log(`Updated people textures:`, this.peopleTextures);
    }

    /**
     * mixamo.com 애니메이션을 자동으로 찾아서 재생
     * @private
     * @param {string} characterName - 캐릭터 식별자
     */
    _autoPlayMixamoAnimation(characterName) {
        const characterInfo = this.loadedCharacters.get(characterName);
        if (!characterInfo) {
            console.warn(`Character '${characterName}' not found for mixamo animation`);
            return;
        }

        if (!characterInfo.animations || characterInfo.animations.length === 0) {
            console.warn(`No animations found for character '${characterName}'`);
            return;
        }

        // mixamo.com이 포함된 애니메이션 찾기
        let mixamoAnimationIndex = -1;
        for (let i = 0; i < characterInfo.animations.length; i++) {
            const clip = characterInfo.animations[i];
            if (clip.name && clip.name.toLowerCase().includes('mixamo.com')) {
                mixamoAnimationIndex = i;
                console.log(`🎬 Found mixamo.com animation: ${clip.name}`);
                break;
            }
        }

        // mixamo.com 애니메이션이 발견되면 재생
        if (mixamoAnimationIndex >= 0) {
            const clip = characterInfo.animations[mixamoAnimationIndex];
            const action = characterInfo.mixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat); // 반복 재생
            action.play();
            
            console.log(`✅ Auto-playing mixamo.com animation '${clip.name}' for character '${characterName}'`);
        } else {
            console.log(`⚠️ No mixamo.com animation found for character '${characterName}', trying first available animation`);
            
            // mixamo.com 애니메이션이 없으면 첫 번째 애니메이션 재생
            if (characterInfo.animations.length > 0) {
                const firstClip = characterInfo.animations[0];
                const action = characterInfo.mixer.clipAction(firstClip);
                action.setLoop(THREE.LoopRepeat);
                action.play();
                
                console.log(`✅ Auto-playing first animation '${firstClip.name}' for character '${characterName}'`);
            }
        }
    }
}

// 싱글톤 인스턴스 제공
export const envModelLoader = new EnvModelLoader();
export const characterLoader = new CharacterModelLoader();
