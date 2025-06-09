/**
 * SceneManager.js
 * - 여러 씬(Three.js Scene)을 등록하고 전환하며 관리한다.
 */
export default class SceneManager {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneFactories = {}; // 팩토리 함수들 저장
    this.sceneInstances = {}; // 생성된 인스턴스들 저장
    this.current = null;
  }

  /** 씬 팩토리 등록 */
  addScene(name, sceneFactory) {
    this.sceneFactories[name] = sceneFactory;
  }

  /** 씬 가져오기  */
  getScene(name) {
    // 이미 생성된 인스턴스가 있으면 재사용
    if (this.sceneInstances[name]) {
      return this.sceneInstances[name];
    }

    // 없으면 팩토리 함수로 생성
    if (this.sceneFactories[name]) {
      console.log(`🎬 씬 '${name}' 생성 중...`);
      this.sceneInstances[name] = this.sceneFactories[name]();
      return this.sceneInstances[name];
    }

    console.error(`❌ 씬 '${name}'을 찾을 수 없습니다.`);
    return null;
  }

  /** 씬 전환 */
  transitionTo(name) {
    const overlay = document.getElementById('transition-overlay');
    overlay.classList.add('show');

    setTimeout(() => {
      if (this.current && this.current.onExit) {
        this.current.onExit();
      }

      // 여기가 핵심! 필요할 때만 씬 생성
      this.current = this.getScene(name);
      
      if (this.current && this.current.onEnter) {
        this.current.onEnter();
      }

      overlay.classList.remove('show');
    }, 1000);
  }

  // renderLoop()는 그대로 유지
  renderLoop() {
    requestAnimationFrame(() => this.renderLoop());
    
    if (this.current) {
      if (this.current.update) {
        this.current.update();
      }
      
      if (this.current.render) {
        this.current.render();
      }
      
      this.renderer.render(this.current.scene, this.camera);
    }
  }
}