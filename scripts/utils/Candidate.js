import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Candidate {
  constructor(model, animationClips = []) {
    this.model = model;
    this.model.position.set(0, 0, 0); // default position
    this.animationClips = animationClips;
    this.mixer = new THREE.AnimationMixer(model);
    this.currentAction = null;
    this.currentClipIndex = 0;
    // 잠금 플래그: true일 때 playNextHitAnimation 무시
    this.inputLocked = false;
  }

  static async loadFromGLB(path) {
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          const clips = gltf.animations || [];
          const candidate = new Candidate(model, clips);
          resolve(candidate);
        },
        undefined,
        (error) => reject(error)
      );
    });
  }

  addToScene(scene) {
    scene.add(this.model);
  }

  setPosition(position) {
    this.model.position.copy(position);
  }

  /**
   * 재생 중일 때 입력 무시 가능
   * @param {boolean} lockOnce - true이면 호출 후 다시 입력을 잠급니다.
   */
  playNextHitAnimation() {
    if (this.animationClips.length === 0) return;
    // 멈춰 있는 모든 액션 정지
    this.mixer._actions?.forEach(a => { if (a.stop) a.stop(); });
    // 모든 클립을 0초부터 동시에 재생
    this.animationClips.forEach(clip => {
      const action = this.mixer.clipAction(clip);
      action.reset();
      action.play();
    });
  }

  /**
   * 입력 잠금을 해제합니다.
   */
  unlockInput() {
    this.inputLocked = false;
  }
}
