/**
 * SceneTVCount.js
 * - 유권자 경로: 투표소 씬에서 “다음”을 눌러 넘어오는,
 *   TV 보면서 개표 결과를 확인하는 씬 예시
 */
class SceneTVCount {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this._initScene();
    this._createTVUI();
  }

  onEnter() {
    // 카메라 초기 위치 설정 (TV 앞을 바라보도록)
    this.camera.position.set(0, 1.6, 5);
    this.camera.lookAt(0, 1.6, 0);
    document.getElementById('tv-ui').style.display = 'block';
  }

  onExit() {
    document.getElementById('tv-ui').style.display = 'none';
  }

  update() {
    // TV 화면(Plane)에 비디오 재생이나 텍스처 애니메이션을 한다면 여기에
    // 예시: 이 장면에서는 단순히 카메라를 고정해두고 플랫폼만 보여줌
  }

  render() {
    this.renderer.setClearColor(0x111122);
  }

  // --------------------------
  // 내부 초기화
  // --------------------------
  _initScene() {
    this.scene.fog = new THREE.Fog(0x111122, 5, 50);

    // 라이팅
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(5, 10, 5);
    spotLight.castShadow = true;
    this.scene.add(spotLight);

    // 바닥(투표소에서 이어진 느낌)
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x2b2b2b, shininess: 50 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 벽(뒤 배경용)
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x333344 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 4, 0.2), wallMat);
    backWall.position.set(0, 2, -15);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // TV 세트 (Plane + 모서리)
    // 1) TV 틀(테두리)
    const tvFrameMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.5, 0.2), tvFrameMat);
    tvFrame.position.set(0, 2, -14);
    tvFrame.castShadow = true;
    this.scene.add(tvFrame);

    // 2) TV 화면 (Plane) - 여기에는 동영상(Texture를 적용할 수도 있고,
    //    간단히 결과 수치 이미지를 교체해 가면서 보여줄 수도 있습니다.
    const tvScreenGeo = new THREE.PlaneGeometry(4, 2.25);
    // 예시: 미리 준비된 텍스처 이미지 로드 → 투표 결과 이미지
    const textureLoader = new THREE.TextureLoader();
    const tvTex = textureLoader.load('assets/textures/vote_result_placeholder.jpg');
    const tvScreenMat = new THREE.MeshBasicMaterial({ map: tvTex });
    this.tvScreen = new THREE.Mesh(tvScreenGeo, tvScreenMat);
    this.tvScreen.position.set(0, 2, -13.9);
    this.scene.add(this.tvScreen);

    // (선택) 동영상 재생용 VideoTexture 예시
    // const video = document.createElement('video');
    // video.src = 'assets/videos/vote_count.mp4';
    // video.loop = true;
    // video.muted = true;
    // video.play();
    // const videoTex = new THREE.VideoTexture(video);
    // const tvScreenMatVideo = new THREE.MeshBasicMaterial({ map: videoTex });
    // this.videoScreen = new THREE.Mesh(tvScreenGeo, tvScreenMatVideo);
    // this.videoScreen.position.set(0, 2, -13.9);
    // this.scene.add(this.videoScreen);

    // 3) 간단한 카운트 결과 텍스트나 그래프 (추후 HTML/CSS 오버레이로)
  }

  _createTVUI() {
    const div = document.createElement('div');
    div.id = 'tv-ui';
    div.innerHTML = `
      <p>📺 지금 개표 중... 최종 결과를 기다려주세요</p>
    `;
    div.style.display = 'none';
    document.body.appendChild(div);
  }
}
