

class ResultFiveYearsLaterScene {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._initScene();
    this._createUI();
  }

  onEnter() {
    this.camera.position.set(0, 1.6, 5);
    this.camera.lookAt(0, 1.6, 0);
    document.getElementById('fail-ui').style.display = 'block';
  }

  onExit() {
    document.getElementById('fail-ui').style.display = 'none';
  }

  update() {}

  render() {
    this.renderer.setClearColor(0x222222); // 어두운 배경
    this.renderer.render(this.scene, this.camera);
  }

  _initScene() {
    const light = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(light);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshPhongMaterial({ color: 0x333333 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }

  _createUI() {
    if (document.getElementById('fail-ui')) return;
    const div = document.createElement('div');
    div.id = 'fail-ui';
    div.innerHTML = `<h1 style="color: crimson; font-size: 2rem;">💀 낙선하셨습니다. 5년 뒤를 기약하세요.</h1>`;
    div.style.position = 'absolute';
    div.style.top = '40%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.display = 'none';
    div.style.zIndex = '1000';
    div.style.background = 'rgba(0,0,0,0.7)';
    div.style.padding = '30px';
    div.style.borderRadius = '10px';
    div.style.color = 'white';
    div.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    document.body.appendChild(div);
  }
}