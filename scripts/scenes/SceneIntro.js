// scripts/scenes/SceneIntro.js

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

export default class SceneIntro {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();

    // 1) 무대 배경(검은색)
    this.scene.background = new THREE.Color(0x000000);

    // 2) 무대 바닥
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 3) 머리 위에서 비추는 스포트라이트
    const spot = new THREE.SpotLight(0xffffff, 1.5);
    spot.position.set(0, 8, 0); // 머리 위에서 비추는 위치
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    spot.castShadow = true;
    this.scene.add(spot);

    // 4) TV 화면 + 프레임 설정
    this._createVideoScreen();
  }

  onEnter() {
    // 카메라를 “관객 시점”에 배치 (유저가 이 지점에 서서 TV를 보는 느낌)
    this.camera.position.set(0, 2, 5); // 카메라를 더 뒤로 배치
    this.camera.lookAt(0, 2, 0);

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
    video.src = './assets/videos/intro.mp4'; // 녹화한 MP4 경로
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
    const screenGeo = new THREE.PlaneGeometry(6, 3.375); // 화면 크기 확대
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 2, -3); // 카메라 앞쪽
    screen.castShadow = true;
    this.scene.add(screen);

    // 4) TV 프레임(두께를 주기 위해 BoxGeometry)
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.1, 3.45, 0.2), // 프레임 크기 조정
      frameMat
    );
    frame.position.set(0, 2, -3.1);
    frame.castShadow = true;
    this.scene.add(frame);

    // 5) 영상 끝나면 “시작하기” 버튼 띄우기
    video.addEventListener('ended', () => this._showStartButton());
    video.addEventListener('error', () => {
      console.error('Failed to load video');
    });
    video.addEventListener('loadeddata', () => {
      console.log('Video loaded successfully');
    });
  }

  _showStartButton() {
    const btn = document.createElement('button');
    btn.id = 'intro-start';
    btn.textContent = '시작하기';
    Object.assign(btn.style, {
      position: 'absolute',
      bottom: '10%', // 버튼 위치 조정
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '16px 32px', // 버튼 크기 확대
      fontSize: '20px', // 글씨 크기 확대
      background: 'linear-gradient(90deg, #3498db, #2980b9)', // 버튼 스타일 개선
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)', // 그림자 추가
      cursor: 'pointer',
      transition: 'background 0.3s',
    });

    btn.addEventListener('mouseover', () => {
      btn.style.background = 'linear-gradient(90deg, #2980b9, #3498db)';
    });

    btn.addEventListener('mouseout', () => {
      btn.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
    });

    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      btn.remove();
      this.sceneManager.transitionTo('votingBooth');
    });
    this.startButton = btn;
  }
}
