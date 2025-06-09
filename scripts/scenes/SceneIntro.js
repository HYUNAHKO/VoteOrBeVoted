// SceneIntro.js 
import * as THREE from 'three';

export default class SceneIntro {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();

    THREE.ColorManagement.enabled = true;

    // 1) 배경색 명시적 설정 (중요!)
    this.scene.background = new THREE.Color(0x000000); // 어두운 회색

    // 2) 환경광
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3); // 더 밝게
    this.scene.add(ambientLight);

    // 3) 무대 바닥 - PhongMaterial로 변경 
    const floorMat = new THREE.MeshPhongMaterial({ 
      color: 0x444444,  // 회색
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.1, 0);
    floor.receiveShadow = true; 
    this.scene.add(floor);

    // 4) 디버깅용 큐브 추가
    // const testCube = new THREE.Mesh(
    //  new THREE.BoxGeometry(1, 1, 1),
    //  new THREE.MeshPhongMaterial({ color: 0x00ff00 })
    //);
    //testCube.position.set(0, 0.5, 0);
    //testCube.castShadow = true; // 그림자 생성
    //this.scene.add(testCube);

    // 5) 머리 위에서 비추는 스포트라이트
    const spot = new THREE.SpotLight(0xffffff, 2.0); // 더 밝게
    spot.position.set(0, 8, 0); // 약간 앞으로
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.3;
    spot.castShadow = true;
    spot.shadow.mapSize.width = 2048;
    spot.shadow.mapSize.height = 2048;
    spot.shadow.camera.near = 0.5;
    spot.shadow.camera.far = 15;
    spot.distance = 0; 
    spot.decay    = 0; 

    // 6) AxesHelper 추가 (좌표축 표시)
    // const axesHelper = new THREE.AxesHelper(5);
    //this.scene.add(axesHelper);

    spot.target.position.set(0, 0, 0);
    this.scene.add(spot.target);
    this.scene.add(spot);

    // 7) TV 화면 + 프레임 설정
    this._createVideoScreen();

    // 디버깅 정보
    console.log('🎬 SceneIntro 씬 구성:', {
      children: this.scene.children.length,
      meshes: this.scene.children.filter(child => child.isMesh).map(m => ({
        name: m.constructor.name,
        position: m.position,
        visible: m.visible
      }))
    });
  }

  onEnter() {
    console.log('SceneIntro onEnter');
    
    // 카메라를 더 뒤로 빼서 전체 씬이 보이도록
    this.camera.position.set(0, 2, 5);    
    this.camera.rotation.set(0, 0, 0);    
    this.camera.lookAt(0, 2, -3);         // TV 화면을 바라보게
    this.camera.updateProjectionMatrix();
    
    // FOV 확인
    console.log('📺 카메라 설정:', {
      position: this.camera.position.clone(),
      fov: this.camera.fov,
      aspect: this.camera.aspect,
      near: this.camera.near,
      far: this.camera.far
    });

    // 비디오 재생 시작
    this._tryPlayVideo();
  }

  onExit() {
    console.log('SceneIntro onExit');
    
    if (this.startButton) {
      this.startButton.remove();
      this.startButton = null;
    }
    
    if (this.clickToPlayButton) {
      this.clickToPlayButton.remove();
      this.clickToPlayButton = null;
    }
    
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
    // 렌더러 확인
    if (!this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }


  _createVideoScreen() {
    const video = document.createElement('video');
    video.src = './assets/videos/intro.mp4';
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    this.video = video;

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

    const frameMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 3.55, 0.2),
      frameMat
    );
    frame.position.set(0, 2, -1.1);
    frame.castShadow = true;
    this.scene.add(frame);

    // 이벤트 리스너들...
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

    video.load();
  }

  _tryPlayVideo() {
    if (!this.video) return;

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