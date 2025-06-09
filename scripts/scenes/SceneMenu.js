/**
 * SceneMenu.js
 * - 첫 번째 화면: “유권자” 또는 “대통령 후보” 선택 UI
 * - HTML 오버레이(#menu-overlay)를 생성하고, 버튼 클릭 시 SceneManager로 전환 요청
 */
export default class SceneMenu {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    // SceneMenu 자체는 Three.js Scene을 렌더링하지 않고, 배경색 정도만 세팅
    this.scene = new THREE.Scene();
    this._createMenuOverlay();
  }

  /** 진입 시 호출 */
  onEnter() {
    // 카메라 기본 위치(원하는 대로 세팅)
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);

    // 메뉴 오버레이 보이기
    document.getElementById('menu-overlay').style.display = 'block';
  }

  /** 종료 시 호출 */
  onExit() {
    document.getElementById('menu-overlay').style.display = 'none';
  }

  /** 매 프레임마다 원하는 애니메이션 업데이트 */
  update() {
    // 필요 시 배경 애니메이션 추가 가능 (현재는 없음)
  }

  /** 화면 렌더링 (menu는 단색 배경만 사용) */
  render() {
    // 기본 화면 컬러 설정 혹은 라이트만 두고 간단하게 렌더
    this.renderer.setClearColor(0x222233);
  }

  /** HTML 버튼 오버레이 생성 */
  _createMenuOverlay() {
    const div = document.createElement('div');
    div.id = 'menu-overlay';
    div.innerHTML = `
      <h1>대선 게임</h1>
      <button id="btn-voter">▶ 유권자로 시작</button>
      <button id="btn-candidate">▶ 후보로 시작</button>
      <button id="btn-result">▶ 개표 결과 화면(연타 테스트)</button>
      <button id="btn-ending">▶ 엔딩 화면</button>
    `;
    div.style.display = 'none';
    document.body.appendChild(div);

    // 버튼 이벤트 리스너
    document.getElementById('btn-voter').addEventListener('click', () => {
      this.sceneManager.transitionTo('votingBooth');
    });
    document.getElementById('btn-candidate').addEventListener('click', () => {
      this.sceneManager.transitionTo('candidateCamp');
    });
    document.getElementById('btn-result').addEventListener('click', () => {
    this.sceneManager.transitionTo('resultBroadcast');
    });
    document.getElementById('btn-ending').addEventListener('click', () => {
      this.sceneManager.transitionTo('ending');
    });
  }
}
