/**
 * SceneManager.js
 * - 여러 씬(Three.js Scene)을 등록하고 전환하며 관리한다.
 */
export default class SceneManager  {
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
    
    if (this.current) {
      // 1. 씬의 update 메서드 호출 (VideoTexture 업데이트 등)
      if (this.current.update) {
        this.current.update();
      }
      
      // 2. 씬의 render 메서드 호출 (setClearColor 등)
      if (this.current.render) {
        this.current.render();
      }
      
      // 3. Three.js 렌더링 실행
      this.renderer.render(this.current.scene, this.camera);
    }
  }

  /** SceneManager 시작 (renderLoop 시작) */
  start() {
    this.renderLoop();
  }
}