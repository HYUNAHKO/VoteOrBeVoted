import * as THREE from 'three';

export default class BaseScene {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
  }

  onEnter() {
    // 씬 진입 시 초기화할 내용
  }

  onExit() {
    // 씬에서 나갈 때 정리할 내용
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  update() {
    // 매 프레임마다 호출되는 업데이트 함수
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}