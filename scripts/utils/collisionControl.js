import * as THREE from 'three';

/* 
 * collisionControl.js: 충돌 체크 시스템
 * 
 * 충돌 체크가 필요한 오브젝트들을 등록하고, 카메라의 이동 방향으로 충돌 체크를 수행
 * 충돌이 감지되면 이동을 막고, 충돌이 없으면 이동을 허용
 * 
 * // 사용 예시:
 * const collisionControl = new CollisionControl();
 * 
 * // 충돌 체크가 필요한 오브젝트 등록:
 * collisionControl.addCollidableObject(building);
 * collisionControl.addCollidableObject(wall);
 * 
 * // 전체 모델을 충돌 체크 대상에 넣고, interactableObject만 빼고싶다면:
 * collisionControl.addCollidableModel(model);
 * collisionControl.removeCollidableObject(interactableObject);
 * 
 * // 오브젝트 이동 시 충돌 체크
 * _updateMovement() 안에서
 *    if (this.collisionControl.preventCollision(movement)) {
 *        this.camera.position.add(movement);
 *    }
 */

export default class CollisionControl {
    constructor(camera) {
        this.camera = camera;
        this.collidableObjects = new Set();
        this.raycaster = new THREE.Raycaster();
        this.direction = new THREE.Vector3();
        this.origin = new THREE.Vector3();
        this.collisionDistance = 1.5; // 카메라와 충돌 오브젝트 사이의 최소 거리
    }

    // 충돌 체크가 필요한 오브젝트들을 등록
    addCollidableObject(object) {
        if (object instanceof THREE.Object3D) {
            this.collidableObjects.add(object);
        }
    }

    // 모델 전체를 충돌 오브젝트로 등록
    addCollidableModel(model) {
        if (!(model instanceof THREE.Object3D)) {
            console.warn('Invalid model object provided');
            return;
        }

        // 모델의 모든 메시를 순회하며 등록
        model.traverse((child) => {
            if (child.isMesh) {
                this.collidableObjects.add(child);
                console.log(`Added collision object: ${child.name}`);
            }
        });
    }

    // 특정 이름을 가진 메시들만 충돌 오브젝트로 등록
    addCollidableMeshesByName(model, namePattern) {
        if (!(model instanceof THREE.Object3D)) {
            console.warn('Invalid model object provided');
            return;
        }

        model.traverse((child) => {
            if (child.isMesh && child.name.includes(namePattern)) {
                this.collidableObjects.add(child);
                console.log(`Added collision object: ${child.name}`);
            }
        });
    }

    // 충돌 체크가 더 이상 필요없는 오브젝트 제거
    removeCollidableObject(object) {
        this.collidableObjects.delete(object);
    }

    // 모델 전체를 충돌 오브젝트에서 제거
    removeCollidableModel(model) {
        if (!(model instanceof THREE.Object3D)) {
            console.warn('Invalid model object provided');
            return;
        }

        model.traverse((child) => {
            if (child.isMesh) {
                this.collidableObjects.delete(child);
                console.log(`Removed collision object: ${child.name}`);
            }
        });
    }

    // 모든 충돌 가능한 오브젝트 제거
    clearCollidableObjects() {
        this.collidableObjects.clear();
    }

    // 카메라의 이동 방향으로 충돌 체크
    checkCollision(movement) {
        if (!this.collidableObjects.size) return false;

        // 카메라의 현재 위치를 기준으로 여러 높이에서 레이캐스팅 체크
        const cameraPos = this.camera.position;
        const rayOrigins = [
            new THREE.Vector3(cameraPos.x, cameraPos.y, cameraPos.z),           // 카메라 높이
            new THREE.Vector3(cameraPos.x, cameraPos.y - 1, cameraPos.z),      // 카메라 아래 1m
            new THREE.Vector3(cameraPos.x, cameraPos.y - 2, cameraPos.z),      // 카메라 아래 2m
            new THREE.Vector3(cameraPos.x, Math.max(-100, cameraPos.y - 100), cameraPos.z) // 카메라 아래 3m (최소 0)
        ];

        this.direction.copy(movement).normalize();

        // 각 높이에서 충돌 체크
        for (const origin of rayOrigins) {
            this.raycaster.set(origin, this.direction);
            
            // 레이캐스팅으로 충돌 체크
            const intersects = this.raycaster.intersectObjects(Array.from(this.collidableObjects), true);
            
            // 충돌이 감지되었고, 충돌 지점이 설정된 최소 거리보다 가까운 경우
            if (intersects.length > 0 && intersects[0].distance < this.collisionDistance) {
                return true;
            }
        }

        return false;
    }

    // 카메라의 이동을 제한하고 충돌을 방지
    preventCollision(movement) {
        if (this.checkCollision(movement)) {
            // 충돌이 감지되면 이동을 막음
            return false;
        }
        // 충돌이 없으면 이동 허용
        return true;
    }

    // 충돌 거리 설정
    setCollisionDistance(distance) {
        this.collisionDistance = distance;
    }

    // 현재 등록된 충돌 오브젝트 수 반환
    getCollidableObjectCount() {
        return this.collidableObjects.size;
    }
}
