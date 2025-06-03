/**
 * SceneManager.js
 * - 여러 씬(Three.js Scene)을 등록하고 전환하며 관리한다.
 */
class SceneManager {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.scenes = {};
    this.current = null; // 현재 활성 씬 객체
  }

  /** 씬 등록 */
  addScene(name, sceneInstance) {
    this.scenes[name] = sceneInstance;
  }

  /** 씬 전환 (fade 효과 포함) */
  transitionTo(name) {
    const overlay = document.getElementById('transition-overlay');
    overlay.classList.add('show');

    // 1초 후에 실제 씬 전환
    setTimeout(() => {
      if (this.current && this.current.onExit) {
        this.current.onExit();
      }

      this.current = this.scenes[name];
      if (this.current.onEnter) {
        this.current.onEnter();
      }

      overlay.classList.remove('show');
    }, 1000);
  }

  /** 매 프레임마다 호출 */
  renderLoop() {
    requestAnimationFrame(() => this.renderLoop());
    if (this.current && this.current.update) {
      this.current.update();
    }
    if (this.current && this.current.render) {
      this.renderer.render(this.current.scene, this.camera);
    }
  }
}
