/**
 * SceneCandidateRegister.js
 * - 후보 등록 과정 안내
 */
class SceneCandidateRegister {
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
    this.renderer.setClearColor(0x333344);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scene-overlay';
    this.overlay.innerHTML = '<p>후보 등록 비용과 절차를 확인합니다.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
