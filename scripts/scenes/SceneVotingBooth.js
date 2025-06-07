/**
 * SceneVotingBooth.js
 * - 유권자 경로 진입 후 보게 되는 투표소 씬
 * - 투표소 예시를 SceneMenu 패턴에 맞춰 감쌌습니다.
 */
class SceneVotingBooth {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._initScene();
    this._initControls();
  }

  onEnter() {
    // 카메라 초기 위치
    this.camera.position.set(0, 1.6, 5);
    this.camera.lookAt(0, 0, 0);
  }

  onExit() {
    // 씬을 떠날 때 추가 정리할 것이 있다면 여기에
    window.removeEventListener('keydown', this._keydownHandler);
    window.removeEventListener('keyup', this._keyupHandler);
    window.removeEventListener('mousemove', this._mouseMoveHandler);
  }

  update() {
    this._moveCamera();
    // 예: 깃발 흔들기
    if (this.flag) {
      this.flag.rotation.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
  }

  render() {
    this.renderer.setClearColor(0xcccccc);
  }

  // --------------------------
  // 내부 초기화 함수들
  // --------------------------
  _initScene() {
    // 안개 효과
    this.scene.fog = new THREE.Fog(0xcccccc, 10, 100);

    // 라이팅
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    this.scene.add(dirLight);

    // 바닥
    const floorMat = new THREE.MeshPhongMaterial({ color: 0xf0f0f0, shininess: 100 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 벽
    const wallMat = new THREE.MeshPhongMaterial({ color: 0xe8e8e8 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.2), wallMat);
    backWall.position.set(0, 2, -15);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const sideWallMat = wallMat;
    const sideWall1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 30), sideWallMat);
    sideWall1.position.set(-15, 2, 0);
    sideWall1.castShadow = true;
    sideWall1.receiveShadow = true;
    this.scene.add(sideWall1);

    const sideWall2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 30), sideWallMat);
    sideWall2.position.set(15, 2, 0);
    sideWall2.castShadow = true;
    sideWall2.receiveShadow = true;
    this.scene.add(sideWall2);

    // 투표 부스 (간단히 4개)
    const boothMaterial = new THREE.MeshPhongMaterial({ color: 0x4169e1 });
    for (let i = 0; i < 4; i++) {
      const booth = this._createVotingBooth(-8 + i * 4, -8);
      this.scene.add(booth);
    }

    // 태극기
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3),
      new THREE.MeshPhongMaterial({ color: 0x666666 })
    );
    pole.position.set(-10, 1.5, -14);
    pole.castShadow = true;
    this.scene.add(pole);

    const flagMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1), flagMat);
    this.flag.position.set(-9.25, 2.5, -14);
    this.flag.castShadow = true;
    this.scene.add(this.flag);

    // 표지판
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 0.1),
      new THREE.MeshPhongMaterial({ color: 0x2c3e50 })
    );
    sign.position.set(0, 3, -14.9);
    this.scene.add(sign);
  }

  _createVotingBooth(x, z) {
    const group = new THREE.Group();

    // 부스 본체
    const base = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), new THREE.MeshPhongMaterial({ color: 0x4169e1 }));
    base.position.y = 1.25;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 옆 패널
    const panelMat = new THREE.MeshPhongMaterial({ color: 0x6495ed });
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 1.5), panelMat);
    leftPanel.position.set(-1, 1, 0.25);
    leftPanel.castShadow = true;
    group.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 1.5), panelMat);
    rightPanel.position.set(1, 1, 0.25);
    rightPanel.castShadow = true;
    group.add(rightPanel);

    // 탁자
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 1), new THREE.MeshPhongMaterial({ color: 0x8b7355 }));
    table.position.set(0, 1, 0.5);
    table.castShadow = true;
    table.receiveShadow = true;
    group.add(table);

    // 용지
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.7), new THREE.MeshPhongMaterial({ color: 0xffffff }));
    paper.position.set(0, 1.06, 0.5);
    paper.receiveShadow = true;
    group.add(paper);

    // 펜
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15), new THREE.MeshPhongMaterial({ color: 0x000000 }));
    pen.position.set(0.3, 1.08, 0.5);
    pen.rotation.z = Math.PI / 2;
    group.add(pen);

    group.position.set(x, 0, z);
    return group;
  }

  _initControls() {
    this.keys = {};
    this.moveSpeed = 0.1;

    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetRotX = 0;
    this.targetRotY = 0;

    window.addEventListener('mousemove', e => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });
  }

  _moveCamera() {
    // 마우스 회전
    this.targetRotY = this.mouseX * Math.PI * 0.5;
    this.targetRotX = this.mouseY * Math.PI * 0.25;
    this.camera.rotation.y += (this.targetRotY - this.camera.rotation.y) * 0.05;
    this.camera.rotation.x += (this.targetRotX - this.camera.rotation.x) * 0.05;

    // WASD 이동
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    right.y = 0; right.normalize();

    if (this.keys['w']) this.camera.position.add(forward.multiplyScalar(this.moveSpeed));
    if (this.keys['s']) this.camera.position.add(forward.multiplyScalar(-this.moveSpeed));
    if (this.keys['a']) this.camera.position.add(right.multiplyScalar(-this.moveSpeed));
    if (this.keys['d']) this.camera.position.add(right.multiplyScalar(this.moveSpeed));

    // 경계 제한
    this.camera.position.x = Math.max(-14, Math.min(14, this.camera.position.x));
    this.camera.position.z = Math.max(-14, Math.min(14, this.camera.position.z));
  }
}
