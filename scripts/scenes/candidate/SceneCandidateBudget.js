/**
 * SceneCandidateBudget.js
 * - 선거 비용 계산 장면
 */
class SceneCandidateBudget {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._createOverlay();
  }

  onEnter() {
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);
    this.overlay.style.display = 'block';
  }

  onExit() {
    this.overlay.style.display = 'none';
  }

  update() {}

  render() {
    this.renderer.setClearColor(0x444455);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scene-overlay';
    this.overlay.innerHTML = '<p>포스터, 유세 트럭 등에 필요한 예산을 계산합니다.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
