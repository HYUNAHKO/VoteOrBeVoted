// Ensure THREE is available globally if needed
if (typeof window !== 'undefined' && !window.THREE) {
  window.THREE = await import('three');
}
import * as THREE from 'three';
export default class Candidate {
  constructor(model, animationClips) {
    this.model = model;
    this.model.position.set(0, 0, 0); // default position, can be updated externally
    this.animationClips = animationClips; // Array of THREE.AnimationClip
    this.mixer = new THREE.AnimationMixer(model);
    this.currentAction = null;
    this.currentClipIndex = 0;
    if (typeof window !== 'undefined' && window.scene) {
      window.scene.add(this.model);
    }
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
