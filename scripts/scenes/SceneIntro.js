// SceneIntro.js 
import * as THREE from 'three';

export default class SceneIntro {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();

    THREE.ColorManagement.enabled = true;

    // 초기화 상태 추적
    this.initialized = false;

    // 비디오 관련 변수들 미리 선언
    this.video = null;
    this.videoTexture = null;
    this.screen = null;
    this.startButton = null;
    this.clickToPlayButton = null;

    // 1) 배경색 명시적 설정
    this.scene.background = new THREE.Color(0x000000);

    // 2) 환경광 (가벼운 작업)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);

    // 3) 무대 바닥 (가벼운 작업)
    const floorMat = new THREE.MeshPhongMaterial({ 
      color: 0x444444,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.1, 0);
    floor.receiveShadow = true; 
    this.scene.add(floor);

    // 4) 스포트라이트 (가벼운 작업)
    const spot = new THREE.SpotLight(0xffffff, 2.0);
    spot.position.set(0, 8, 0);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.3;
    spot.castShadow = true;
    spot.shadow.mapSize.width = 2048;
    spot.shadow.mapSize.height = 2048;
    spot.shadow.camera.near = 0.5;
    spot.shadow.camera.far = 15;
    spot.distance = 0; 
    spot.decay = 0; 

    spot.target.position.set(0, 0, 0);
    this.scene.add(spot.target);
    this.scene.add(spot);

    // ⚠️ 비디오 화면은 onEnter에서 생성하도록 변경
    // this._createVideoScreen(); // 제거!

    console.log('🎬 SceneIntro 생성자 완료 (lightweight)');
  }

  onEnter() {
    console.log('SceneIntro onEnter');
    
    // 한 번만 비디오 화면 초기화
    if (!this.initialized) {
      console.log('🎥 비디오 화면 초기화 시작...');
      this._createVideoScreen();
      this.initialized = true;
    }
    
    // 카메라 설정 (매번 입장할 때마다)
    this.camera.position.set(0, 2, 5);    
    this.camera.rotation.set(0, 0, 0);    
    this.camera.lookAt(0, 2, -3);
    this.camera.updateProjectionMatrix();
    
    console.log('📺 카메라 설정:', {
      position: this.camera.position.clone(),
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      near: this.camera.near,
      far: this.camera.far
    });

    // 비디오 재생 시작 (비디오가 로드된 경우에만)
    this._tryPlayVideo();
  }

  onExit() {
    console.log('SceneIntro onExit');
    
    // UI 버튼들 정리
    if (this.startButton) {
      this.startButton.remove();
      this.startButton = null;
    }
    
    if (this.clickToPlayButton) {
      this.clickToPlayButton.remove();
      this.clickToPlayButton = null;
    }
    
    // 비디오 일시정지 (메모리는 유지)
    if (this.video) {
      this.video.pause();
    }
  }

  update() {
    if (this.videoTexture && this.video) {
      this.videoTexture.needsUpdate = true;
    }
  }

  render() {
    // 렌더러 그림자 설정 확인
    if (!this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  // 무거운 작업: 비디오 화면 생성 (onEnter에서만 호출)
  _createVideoScreen() {
    console.log('🎬 비디오 요소 생성 중...');
    
    // 1) 비디오 요소 생성
    const video = document.createElement('video');
    video.src = './assets/videos/intro.mp4';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    this.video = video;

    // 2) 비디오 텍스처 생성
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.colorSpace = THREE.SRGBColorSpace; 
    this.videoTexture = videoTexture;

    // 3) 화면 Plane 메쉬 
    const screenGeo = new THREE.PlaneGeometry(6, 3.375);
    const screenMat = new THREE.MeshBasicMaterial({ map: videoTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 2, -1);
    screen.castShadow = true;
    this.scene.add(screen);
    this.screen = screen;

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
      this.videoTexture.colorSpace = THREE.SRGBColorSpace;
      this.screen.material = new THREE.MeshBasicMaterial({ 
          map: this.videoTexture,
          side: THREE.FrontSide
      });
      this.videoTexture.needsUpdate = true;
    });

    video.addEventListener('ended', () => {
      console.log('🔚 Video ended');
      this._showStartButton();
    });

    video.addEventListener('error', (e) => {
      console.error('❌ Video error:', e);
      const errorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.screen.material = errorMaterial;
    });

    // 6) 비디오 로드 시작 (이제 실제로 필요할 때만!)
    video.load();
    console.log('📥 비디오 로드 시작');
  }

  _tryPlayVideo() {
    if (!this.video) {
      console.log('⚠️ 비디오가 아직 준비되지 않음');
      return;
    }

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

  // 메모리 정리 
  dispose() {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
      this.video = null;
    }
    
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }
    
    if (this.startButton && this.startButton.parentNode) {
      this.startButton.parentNode.removeChild(this.startButton);
    }
    
    if (this.scene) {
      this.scene.clear();
    }
    
    console.log('SceneIntro disposed');
  }
}