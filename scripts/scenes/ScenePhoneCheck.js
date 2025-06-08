// ScenePhoneCheck.js - 핸드폰으로 공약 확인하는 씬
export default class ScenePhoneCheck {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.isActive = false;
    this.timer = 20; // 20초 타이머
    this.timerInterval = null;
    
    this._init();
  }

  _init() {
    // 1) 배경 - 어두운 실내
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // 2) 조명 (핸드폰 화면빛 중심)
    this._setupLighting();
    
    // 3) 핸드폰 3D 모델
    this._createPhone();
    
    // 4) 카메라 위치 (핸드폰을 보는 각도)
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);
    
    // 5) UI 오버레이
    this._createPhoneUI();
  }

  _setupLighting() {
    // 어두운 주변광
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambientLight);
    
    // 핸드폰 화면에서 나오는 빛
    const phoneLight = new THREE.PointLight(0x6699ff, 1, 5);
    phoneLight.position.set(0, 0, 1);
    this.scene.add(phoneLight);
  }

  _createPhone() {
    // 핸드폰 몸체
    const phoneGeometry = new THREE.BoxGeometry(1.2, 2.2, 0.1);
    const phoneMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.phone = new THREE.Mesh(phoneGeometry, phoneMaterial);
    this.scene.add(this.phone);
    
    // 핸드폰 화면 (파란색 발광)
    const screenGeometry = new THREE.PlaneGeometry(1, 1.8);
    const screenMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x6699ff, 
      opacity: 0.8, 
      transparent: true 
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.06;
    this.phone.add(screen);
    
    // 홈 버튼
    const buttonGeometry = new THREE.CircleGeometry(0.08, 16);
    const buttonMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const homeButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
    homeButton.position.set(0, -1.2, 0.06);
    this.phone.add(homeButton);
  }

  _createPhoneUI() {
    // 전체 UI 컨테이너
    this.phoneUIContainer = document.createElement('div');
    this.phoneUIContainer.id = 'phone-ui-container';
    Object.assign(this.phoneUIContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1000'
    });

    // 타이머 표시
    this.timerDisplay = document.createElement('div');
    this.timerDisplay.id = 'timer-display';
    Object.assign(this.timerDisplay.style, {
      position: 'absolute',
      top: '20px',
      right: '20px',
      color: 'white',
      fontSize: '18px',
      fontWeight: 'bold',
      fontFamily: 'Malgun Gothic, sans-serif',
      background: 'rgba(0,0,0,0.5)',
      padding: '5px 10px',
      borderRadius: '5px'
    });
    this.timerDisplay.textContent = `남은 시간: ${this.timer}초`;

    // 핸드폰 화면 오버레이
    this.phoneScreen = document.createElement('div');
    this.phoneScreen.id = 'phone-screen-overlay';
    Object.assign(this.phoneScreen.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '300px',
      height: '500px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '20px',
      padding: '20px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
      color: 'white',
      fontFamily: 'Malgun Gothic, sans-serif',
      overflow: 'hidden'
    });

    // 앱 제목
    const appTitle = document.createElement('div');
    appTitle.innerHTML = '📱 투표 정보 확인';
    Object.assign(appTitle.style, {
      fontSize: '18px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '1px solid rgba(255,255,255,0.3)'
    });
    this.phoneScreen.appendChild(appTitle);

    // 후보자 목록
    this._createCandidateList();

    // 여론 확인 섹션
    this._createPublicOpinionSection();

    this.phoneUIContainer.appendChild(this.timerDisplay);
    this.phoneUIContainer.appendChild(this.phoneScreen);
  }

  _createCandidateList() {
    const candidatesSection = document.createElement('div');
    candidatesSection.innerHTML = '<h3 style="margin: 10px 0; font-size: 16px;">🗳️ 후보자 공약 확인</h3>';
    
    const candidates = [
      { name: '김후보', party: '가나당', key: 'A' },
      { name: '이후보', party: '다라당', key: 'B' },
      { name: '박후보', party: '마바당', key: 'C' }
    ];

    candidates.forEach((candidate, index) => {
      const candidateBtn = document.createElement('button');
      candidateBtn.innerHTML = `${candidate.key}. ${candidate.name} (${candidate.party})`;
      Object.assign(candidateBtn.style, {
        display: 'block',
        width: '100%',
        margin: '8px 0',
        padding: '12px',
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background 0.3s'
      });

      candidateBtn.addEventListener('click', () => {
        this._showCandidateInfo(candidate);
      });

      candidateBtn.addEventListener('mouseenter', () => {
        candidateBtn.style.background = 'rgba(255,255,255,0.3)';
      });

      candidateBtn.addEventListener('mouseleave', () => {
        candidateBtn.style.background = 'rgba(255,255,255,0.2)';
      });

      candidatesSection.appendChild(candidateBtn);
    });

    this.phoneScreen.appendChild(candidatesSection);
  }

  _createPublicOpinionSection() {
    const opinionSection = document.createElement('div');
    opinionSection.innerHTML = '<h3 style="margin: 15px 0 10px 0; font-size: 16px;">💬 여론 확인</h3>';
    
    // 가짜 뉴스 기사
    const newsItem = document.createElement('div');
    Object.assign(newsItem.style, {
      background: 'rgba(255,255,255,0.1)',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '10px',
      fontSize: '12px',
      lineHeight: '1.4'
    });
    newsItem.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">📰 "선거 D-7, 후보들 마지막 공약 발표"</div>
      <div style="color: #ccc;">각 후보들이 마지막 공약을 발표하며 치열한 경쟁...</div>
    `;

    // 댓글 공감/비추 버튼
    const commentSection = document.createElement('div');
    commentSection.innerHTML = '<div style="font-size: 12px; margin: 10px 0 5px 0;">댓글 반응:</div>';
    
    const reactionButtons = document.createElement('div');
    Object.assign(reactionButtons.style, {
      display: 'flex',
      gap: '10px'
    });

    const likeBtn = document.createElement('button');
    likeBtn.innerHTML = '👍 공감 (1,234)';
    const dislikeBtn = document.createElement('button');
    dislikeBtn.innerHTML = '👎 비추 (567)';

    [likeBtn, dislikeBtn].forEach(btn => {
      Object.assign(btn.style, {
        flex: '1',
        padding: '8px',
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '11px'
      });
    });

    reactionButtons.appendChild(likeBtn);
    reactionButtons.appendChild(dislikeBtn);
    commentSection.appendChild(reactionButtons);

    opinionSection.appendChild(newsItem);
    opinionSection.appendChild(commentSection);
    this.phoneScreen.appendChild(opinionSection);
  }

  _showCandidateInfo(candidate) {
    // 임시 팝업으로 후보자 정보 표시
    const popup = document.createElement('div');
    Object.assign(popup.style, {
      position: 'absolute',
      top: '20px',
      left: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '10px',
      fontSize: '12px',
      zIndex: '1001'
    });

    const policies = {
      'A': ['교육비 지원 확대', '청년 일자리 창출', '환경 보호 정책'],
      'B': ['의료비 절감', '교통 인프라 확충', '중소기업 지원'],
      'C': ['복지 제도 개선', '문화 예술 진흥', '디지털 혁신']
    };

    popup.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px;">${candidate.name} (${candidate.party}) 주요 공약</div>
      ${policies[candidate.key].map(policy => `<div>• ${policy}</div>`).join('')}
      <button id="close-popup" style="margin-top: 10px; padding: 5px 10px; background: #666; color: white; border: none; border-radius: 3px; cursor: pointer;">닫기</button>
    `;

    this.phoneScreen.appendChild(popup);

    document.getElementById('close-popup').addEventListener('click', () => {
      popup.remove();
    });

    // 3초 후 자동으로 팝업 닫기
    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 3000);
  }

  _startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer--;
      this.timerDisplay.textContent = `남은 시간: ${this.timer}초`;
      
      if (this.timer <= 0) {
        this._endScene();
      }
    }, 1000);
  }

  _endScene() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    if (this.isActive) {
      this.deactivate();
      this.sceneManager.transitionTo('voteChoice');
    }
  }

  activate() {
    console.log('ScenePhoneCheck activated');
    this.isActive = true;
    
    // UI 추가
    document.body.appendChild(this.phoneUIContainer);
    
    // 타이머 시작
    this._startTimer();
    
    // 핸드폰 약간 회전 애니메이션
    let rotation = 0;
    const rotatePhone = () => {
      if (this.isActive) {
        rotation += 0.01;
        this.phone.rotation.z = Math.sin(rotation) * 0.1;
        requestAnimationFrame(rotatePhone);
      }
    };
    rotatePhone();
  }

  deactivate() {
    console.log('ScenePhoneCheck deactivated');
    this.isActive = false;
    
    // 타이머 정리
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // UI 제거
    if (this.phoneUIContainer && this.phoneUIContainer.parentNode) {
      this.phoneUIContainer.parentNode.removeChild(this.phoneUIContainer);
    }
  }

  update(deltaTime) {
    // 화면 빛 깜빡임
    if (this.isActive) {
      const time = Date.now() * 0.002;
      const light = this.scene.children.find(child => child.type === 'PointLight');
      if (light) {
        light.intensity = 1 + Math.sin(time) * 0.2;
      }
    }
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.deactivate();
    
    // 메모리 정리
    this.scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}