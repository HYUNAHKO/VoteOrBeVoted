/**
 * SceneVoterVoteChoice.js
 * - 사전투표 또는 본 투표 선택 화면
 */
class SceneVoterVoteChoice {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._createOverlay();
  }

  onEnter() {
    this.camera.position.set(0, 1.6, 4);
    this.camera.lookAt(0, 1.6, 0);
    this.overlay.style.display = 'block';
  }

  onExit() {
    this.overlay.style.display = 'none';
  }

  update() {}

  render() {
    this.renderer.setClearColor(0x1e1e1e);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scene-overlay';
    this.overlay.innerHTML = '<p>사전투표를 할지 본 투표를 할지 선택하세요.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
