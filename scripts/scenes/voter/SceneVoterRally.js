/**
 * SceneVoterRally.js
 * - 대통령 후보 유세 현장을 바라보는 첫 화면
 */
class SceneVoterRally {
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
    this.renderer.setClearColor(0x222233);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scene-overlay';
    this.overlay.innerHTML = '<p>유세 현장을 둘러보고 휴대폰으로 공약을 검색해보세요.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
