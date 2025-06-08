// SceneIntro.js - 카메라 위치 완전 수정
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
    console.log('SceneIntro onEnter');
    
    // 🔥 카메라 위치 완전 고정 (절대 변경되지 않음)
    this.camera.position.set(0, 2, 5);    // 고정 위치
    this.camera.rotation.set(0, 0, 0);    // 회전 리셋
    this.camera.lookAt(0, 2, -3);         // TV 화면을 바라보게
    this.camera.updateProjectionMatrix();
    
    console.log('📺 SceneIntro 카메라 고정 완료:', {
      position: this.camera.position.clone(),
      rotation: this.camera.rotation.clone()
    });

    // 추가적으로 0.1초 후 다시 한 번 확인 (타이밍 문제 방지)
    setTimeout(() => {
      this.camera.position.set(0, 2, 5);
      this.camera.lookAt(0, 2, -3);
      console.log('📺 SceneIntro 카메라 위치 재확인 완료');
    }, 100);

    // 비디오 재생 시작 (사용자 상호작용 후)
    this._tryPlayVideo();
  }

  onExit() {
    console.log('SceneIntro onExit');
    
    // 씬 전환 시 버튼 제거
    if (this.startButton) {
      this.startButton.remove();
      this.startButton = null;
    }
    
    if (this.clickToPlayButton) {
      this.clickToPlayButton.remove();
      this.clickToPlayButton = null;
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

    // 2) VideoTexture 생성
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;
    this.videoTexture = videoTexture;

    // 3) 화면 Plane 메쉬 
    const screenGeo = new THREE.PlaneGeometry(6, 3.375);
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 2, -1);
    screen.castShadow = true;
    this.scene.add(screen);
    this.screen = screen;

    console.log('📺 Screen created:', screen);
    console.log('🎥 Video element:', video);
    console.log('🎬 Video texture:', videoTexture);

    // 4) TV 프레임
    const frameMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 3.55, 0.2),
      frameMat
    );
    frame.position.set(0, 2, -1.1);
    frame.castShadow = true;
    this.scene.add(frame);

    // 5) 비디오 이벤트 리스너
    video.addEventListener('loadeddata', () => {
      console.log('🎥 Video loaded successfully');
      console.log('📐 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('⏱️ Video duration:', video.duration);
      
      // 비디오가 로드되면 VideoTexture를 다시 적용
      this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoTexture.needsUpdate = true;
      console.log('🔄 VideoTexture re-applied after video load');
    });

    video.addEventListener('loadstart', () => {
      console.log('🔄 Video loading started');
    });

    video.addEventListener('canplay', () => {
      console.log('✅ Video can start playing');
      // 재생 가능할 때도 VideoTexture 다시 적용
      this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoTexture.needsUpdate = true;
    });

    video.addEventListener('play', () => {
      console.log('▶️ Video is playing');
      // 재생 시작 시 VideoTexture 확실히 적용
      this.screen.material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoTexture.needsUpdate = true;
    });

    video.addEventListener('ended', () => {
      console.log('🔚 Video ended');
      this._showStartButton();
    });

    video.addEventListener('error', (e) => {
      console.error('❌ Video error:', e);
      console.error('🔢 Video error code:', video.error?.code);
      console.error('💬 Video error message:', video.error?.message);
      
      // 에러 시 빨간색 화면으로 대체
      const errorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.screen.material = errorMaterial;
    });

    // 6) 비디오 로딩 시작
    video.load();
  }

  _tryPlayVideo() {
    if (!this.video) return;

    // 사용자 상호작용 없이 자동 재생 시도
    const playPromise = this.video.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('▶️ Video started playing automatically');
        })
        .catch((error) => {
          console.warn('⚠️ Auto-play failed:', error);

        });
    }
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
      padding: '16px 32px',
      fontSize: '18px',
      background: 'linear-gradient(90deg, #3498db, #2980b9)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.3s',
      zIndex: '1000',
      fontFamily: 'Malgun Gothic, sans-serif'
    });

    btn.addEventListener('mouseover', () => {
      btn.style.background = 'linear-gradient(90deg, #2980b9, #3498db)';
      btn.style.transform = 'translateX(-50%) translateY(-2px)';
    });

    btn.addEventListener('mouseout', () => {
      btn.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
      btn.style.transform = 'translateX(-50%) translateY(0px)';
    });

    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      btn.remove();
      this.sceneManager.transitionTo('home');
    });
    
    this.startButton = btn;
  }
}