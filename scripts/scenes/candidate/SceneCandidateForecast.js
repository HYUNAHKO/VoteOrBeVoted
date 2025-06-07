/**
 * SceneCandidateForecast.js
 * - 사전투표 예측 방송 확인 장면
 */
class SceneCandidateForecast {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._createOverlay();
  }

  onEnter() {
    this.camera.position.set(0, 1.8, 5);
    this.camera.lookAt(0, 1.8, 0);
    this.overlay.style.display = 'block';
  }

  onExit() {
    this.overlay.style.display = 'none';
  }

  update() {}

  render() {
    this.renderer.setClearColor(0x444444);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scene-overlay';
    this.overlay.innerHTML = '<p>사전투표 지지율 예측을 확인합니다.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
