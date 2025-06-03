/**
 * SceneCandidateCamp.js
 * - 후보 경로를 선택했을 때 보여줄 씬(예: 캠페인장, 연설 무대 등)
 * - 현재는 자리만 표시해 두었습니다. 필요에 따라 3D 모델, 맵, 캠페인 인터랙션 등을 추가하세요.
 */
class SceneCandidateCamp {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._initScene();
  }

  onEnter() {
    this.camera.position.set(0, 2, 6);
    this.camera.lookAt(0, 1, 0);
  }

  onExit() {
    // 필요한 정리 코드
  }

  update() {
    // 후보 경로 씬 업데이트 (예: 캐릭터 애니메이션 등)
  }

  render() {
    this.renderer.setClearColor(0x444455);
  }

  _initScene() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    // 간단한 무대(예: Podium) 만들기
    const podiumMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
    const podium = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1), podiumMat);
    podium.position.set(0, 0.75, 0);
    this.scene.add(podium);

    // 바닥
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshPhongMaterial({ color: 0x555566 }));
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // (추후) 후보 캐릭터 모델, 스피치 애니메이션, 토글 가능한 연설 UI 등 추가
  }
}
