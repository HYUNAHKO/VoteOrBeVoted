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
    spot.position.set(0, 8, 0);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    spot.castShadow = true;
    this.scene.add(spot);

    // 4) TV 화면 + 프레임 설정
    this._createVideoScreen();
  }

  onEnter() {
    // 카메라를 "관객 시점"에 배치
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 2, -3);

    // 비디오 재생 시작 (사용자 상호작용 후)
    this._tryPlayVideo();
  }

  onExit() {
    // 씬 전환 시 버튼 제거
    if (this.startButton) {
      this.startButton.remove();
      this.startButton = null;
    }
    
    // 비디오 정지
    if (this.video) {
      this.video.pause();
    }
  }

  update() {
    // VideoTexture 업데이트 (중요!)
    if (this.videoTexture && this.video) {
      // 비디오가 재생 중이든 정지 중이든 항상 업데이트
      this.videoTexture.needsUpdate = true;
    }
  }

  render() {
    this.renderer.setClearColor(0x000000);
  }

  _createVideoScreen() {
    // 1) HTML Video 요소 생성
    const video = document.createElement('video');
    video.src = './assets/videos/intro.mp4';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.loop = false; // 한 번만 재생
    this.video = video;

    // 2) 먼저 테스트용 색상 재질로 화면이 제대로 렌더링되는지 확인
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // 빨간색 테스트

    // 3) VideoTexture 생성
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;
    this.videoTexture = videoTexture;

    // 4) 화면 Plane 메쉬 
    const screenGeo = new THREE.PlaneGeometry(6, 3.375);
    // 처음에는 테스트 재질 사용
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 2, -1);
    // rotation.y = Math.PI 제거 (이게 문제일 수 있음)
    screen.castShadow = true;
    this.scene.add(screen);
    this.screen = screen;

    console.log('Screen created:', screen);
    console.log('Video element:', video);
    console.log('Video texture:', videoTexture);

    // 5) TV 프레임
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 3.55, 0.2),
      frameMat
    );
    frame.position.set(0, 2, -1.1);
    frame.castShadow = true;
    this.scene.add(frame);

    // 6) 비디오 이벤트 리스너
    video.addEventListener('loadeddata', () => {
      console.log('Video loaded successfully');
      console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('Video duration:', video.duration);
      
      // 비디오가 로드되면 VideoTexture를 다시 적용
      this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoTexture.needsUpdate = true;
      console.log('VideoTexture re-applied after video load');
    });

    video.addEventListener('loadstart', () => {
      console.log('Video loading started');
    });

    video.addEventListener('canplay', () => {
      console.log('Video can start playing');
      // 재생 가능할 때도 VideoTexture 다시 적용
      this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoTexture.needsUpdate = true;
    });

    video.addEventListener('play', () => {
      console.log('Video is playing');
      // 재생 시작 시 VideoTexture 확실히 적용
      this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoTexture.needsUpdate = true;
    });

    video.addEventListener('ended', () => {
      console.log('Video ended');
      this._showStartButton();
    });

    video.addEventListener('error', (e) => {
      console.error('Video error:', e);
      console.error('Video error code:', video.error?.code);
      console.error('Video error message:', video.error?.message);
      
      // 에러 시 빨간색 화면으로 대체
      this.screen.material = testMaterial;
    });

    // 7) 비디오 로딩 시작
    video.load();
  }

  _tryPlayVideo() {
    if (!this.video) return;

    // 사용자 상호작용 없이 자동 재생 시도
    const playPromise = this.video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Video started playing automatically');
        })
        .catch((error) => {
          console.warn('Auto-play failed:', error);
          // 자동 재생 실패 시 클릭 유도 버튼 표시
          this._showClickToPlayButton();
        });
    }
  }

  _showClickToPlayButton() {
    const btn = document.createElement('button');
    btn.id = 'click-to-play';
    btn.textContent = '영상 재생하기';
    Object.assign(btn.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '16px 32px',
      fontSize: '18px',
      background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      zIndex: '1000'
    });

    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      this.video.play()
        .then(() => {
          btn.remove();
          console.log('Video started playing after user interaction');
          // 사용자 클릭 후 재생 시에도 VideoTexture 적용
          this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
          this.videoTexture.needsUpdate = true;
        })
        .catch((error) => {
          console.error('Failed to play video even after user interaction:', error);
        });
    });
  }

  _showStartButton() {
    const btn = document.createElement('button');
    btn.id = 'intro-start';
    btn.textContent = '시작하기';
    Object.assign(btn.style, {
      position: 'absolute',
      bottom: '18%',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '6px 8px',
      fontSize: '12px',
      background: 'linear-gradient(90deg, #3498db, #2980b9)',
      color: 'white',
      border: 'none',
      borderRadius: '2px',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
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