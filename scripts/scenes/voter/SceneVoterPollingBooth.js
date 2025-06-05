/**
 * SceneVoterPollingBooth.js
 * - 실제 투표소 내부에서 투표를 진행하는 장면
 */
class SceneVoterPollingBooth {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._createOverlay();
  }

  onEnter() {
    this.camera.position.set(0, 1.6, 5);
    this.camera.lookAt(0, 0, 0);
    this.overlay.style.display = 'block';
  }

  onExit() {
    this.overlay.style.display = 'none';
  }

  update() {}

  render() {
    this.renderer.setClearColor(0xf0f0f0);
  }

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scene-overlay';
    this.overlay.innerHTML = '<p>신분증을 제시하고 기표 후 투표함에 넣습니다.</p>';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }
}
