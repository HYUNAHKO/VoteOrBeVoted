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

  playNextHitAnimation() {
    if (this.animationClips.length === 0) return;

    if (this.currentAction) {
      this.currentAction.stop();
    }

    const clip = this.animationClips[this.currentClipIndex];
    this.currentAction = this.mixer.clipAction(clip);
    this.currentAction.reset();
    this.currentAction.play();

    this.currentClipIndex = (this.currentClipIndex + 1) % this.animationClips.length;
  }
}
