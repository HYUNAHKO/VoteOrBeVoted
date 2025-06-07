

class ResultVictoryScene {
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
    document.getElementById('victory-ui').style.display = 'block';
  }

  onExit() {
    document.getElementById('victory-ui').style.display = 'none';
  }

  update() {
    // No animation logic yet
  }

  render() {
    this.renderer.setClearColor(0xfceabb); // 밝은 배경색
    this.renderer.render(this.scene, this.camera);
  }

  _initScene() {
    const light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshPhongMaterial({ color: 0xfff3cd })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
  }

  _createUI() {
    if (document.getElementById('victory-ui')) return;
    const div = document.createElement('div');
    div.id = 'victory-ui';
    div.innerHTML = `<h1 style="color: darkgreen; font-size: 2rem;">🎉 당신이 당선되었습니다!</h1>`;
    div.style.position = 'absolute';
    div.style.top = '40%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.display = 'none';
    div.style.zIndex = '1000';
    div.style.background = 'rgba(255,255,255,0.8)';
    div.style.padding = '30px';
    div.style.borderRadius = '10px';
    div.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
    document.body.appendChild(div);
  }
}