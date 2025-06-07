// scripts/scenes/SceneIntro.js

import * as THREE from 'three';

export default class SceneIntro {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();

    // 1) 무대 배경(검은색)
    this.scene.background = new THREE.Color(0x000000);

    // 2) 무대 바닥
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 3) 스포트라이트
    const spot = new THREE.SpotLight(0xffffff, 1);
    spot.position.set(0, 5, 5);
    spot.angle = Math.PI / 6;
    spot.penumbra = 0.3;
    spot.castShadow = true;
    this.scene.add(spot);

    // 4) TV 화면 + 프레임 설정
    this._createVideoScreen();
  }

  onEnter() {
    // 카메라를 “관객 시점”에 배치 (유저가 이 지점에 서서 TV를 보는 느낌)
    this.camera.position.set(0, 1.6, 3);
    this.camera.lookAt(0, 1.6, 0);

    // 비디오 재생 시작
    this.video.play();
  }

  onExit() {
    // 씬 전환 시 버튼 제거
    if (this.startButton) {
      this.startButton.remove();
      this.startButton = null;
    }
  }

  update() {
    // (필요 시 무대 위 애니메이션 추가)
  }

  render() {
    // 여전히 배경 검은색
    this.renderer.setClearColor(0x000000);
  }

  _createVideoScreen() {
    // 1) HTML Video 요소 생성
    const video = document.createElement('video');
    video.src = 'assets/videos/intro.mp4';  // 녹화한 MP4 경로
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    this.video = video;

    // 2) VideoTexture로 Three.js 텍스처 생성
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    // 3) 화면 Plane 메쉬
    const screenGeo = new THREE.PlaneGeometry(4, 2.25);
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.6, -2);   // 카메라 앞쪽
    screen.castShadow = true;
    this.scene.add(screen);

    // 4) TV 프레임(두께를 주기 위해 BoxGeometry)
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 2.35, 0.15),
      frameMat
    );
    frame.position.set(0, 1.6, -2.08);
    frame.castShadow = true;
    this.scene.add(frame);

    // 5) 영상 끝나면 “시작하기” 버튼 띄우기
    video.addEventListener('ended', () => this._showStartButton());
  }

  _showStartButton() {
    const btn = document.createElement('button');
    btn.id = 'intro-start';
    btn.textContent = '시작하기';
    Object.assign(btn.style, {
      position: 'absolute',
      bottom: '20%',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      fontSize: '18px',
      background: '#3498db',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    });
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      btn.remove();
      this.sceneManager.transitionTo('votingBooth');
    });
    this.startButton = btn;
  }
}
