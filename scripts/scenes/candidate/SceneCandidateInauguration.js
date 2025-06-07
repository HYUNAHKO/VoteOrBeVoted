/**
 * SceneCandidateInauguration.js
 * - 개표 후 당선 및 취임식 장면
 */
class SceneCandidateInauguration {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._createOverlay();
  }

  onEnter() {
    this.camera.position.set(0, 2, 6);
    this.camera.lookAt(0, 1.5, 0);
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
    this.overlay.innerHTML = '<p>당선 축하! 취임식을 진행합니다.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
