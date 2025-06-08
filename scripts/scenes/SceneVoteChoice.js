// SceneVoteChoice.js - 사전투표 선택 씬
export default class SceneVoteChoice {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.isActive = false;
    
    this._init();
  }

  _init() {
    // 1) 배경 - 깔끔한 투표소 분위기
    this.scene.background = new THREE.Color(0xf0f8ff); // 연한 하늘색
    
    // 2) 조명
    this._setupLighting();
    
    // 3) 간단한 환경
    this._createEnvironment();
    
    // 4) 카메라 위치
    this.camera.position.set(0, 2, 5);
    this.camera.lookAt(0, 0, 0);
    
    // 5) UI 오버레이
    this._createChoiceUI();
  }

  _setupLighting() {
    // 밝은 주변광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    // 상단에서 내려오는 빛
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  _createEnvironment() {
    // 바닥
    const floorGeometry = new THREE.PlaneGeometry(10, 10);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xe6e6fa }); // 연한 보라색
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // 투표함 (상징적)
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x4169e1 }); // 로얄블루
    const voteBox = new THREE.Mesh(boxGeometry, boxMaterial);
    voteBox.position.set(0, 0.5, -2);
    voteBox.castShadow = true;
    this.scene.add(voteBox);
    
    // 투표함 위에 작은 슬롯
    const slotGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.1);
    const slotMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(0, 1.1, -2);
    this.scene.add(slot);
    
    // 한국 국기 색상 장식 (빨강, 파랑)
    const decorGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    
    const redDecor = new THREE.Mesh(decorGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    redDecor.position.set(-2, 1, 0);
    this.scene.add(redDecor);
    
    const blueDecor = new THREE.Mesh(decorGeometry, new THREE.MeshLambertMaterial({ color: 0x0000ff }));
    blueDecor.position.set(2, 1, 0);
    this.scene.add(blueDecor);
  }

  _createChoiceUI() {
    // UI 컨테이너
    this.choiceUIContainer = document.createElement('div');
    this.choiceUIContainer.id = 'choice-ui-container';
    Object.assign(this.choiceUIContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1000'
    });

    // 메인 질문
    this.questionText = document.createElement('div');
    this.questionText.id = 'vote-question';
    Object.assign(this.questionText.style, {
      position: 'absolute',
      top: '30%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: '#2c3e50',
      fontSize: '32px',
      fontWeight: 'bold',
      textAlign: 'center',
      fontFamily: 'Malgun Gothic, sans-serif',
      textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
      opacity: '0',
      transition: 'opacity 1s ease-in-out'
    });
    this.questionText.innerHTML = '사전투표날<br/>투표하실건가요? 🗳️';

    // 선택 버튼들
    this.choiceButtons = document.createElement('div');
    Object.assign(this.choiceButtons.style, {
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '30px',
      pointerEvents: 'auto',
      opacity: '0',
      transition: 'opacity 1s ease-in-out'
    });

    // 예 버튼
    const yesButton = document.createElement('button');
    yesButton.textContent = '네, 사전투표 할게요!';
    Object.assign(yesButton.style, {
      padding: '15px 25px',
      fontSize: '18px',
      background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontFamily: 'Malgun Gothic, sans-serif',
      fontWeight: 'bold',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    });

    // 아니오 버튼
    const noButton = document.createElement('button');
    noButton.textContent = '당일 투표할게요!';
    Object.assign(noButton.style, {
      padding: '15px 25px',
      fontSize: '18px',
      background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontFamily: 'Malgun Gothic, sans-serif',
      fontWeight: 'bold',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    });

    // 버튼 호버 효과
    [yesButton, noButton].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      });
    });

    // 버튼 클릭 이벤트
    yesButton.addEventListener('click', () => {
      this._selectChoice('early');
    });

    noButton.addEventListener('click', () => {
      this._selectChoice('election-day');
    });

    this.choiceButtons.appendChild(yesButton);
    this.choiceButtons.appendChild(noButton);

    this.choiceUIContainer.appendChild(this.questionText);
    this.choiceUIContainer.appendChild(this.choiceButtons);
  }

  _selectChoice(choice) {
    console.log(`사용자 선택: ${choice}`);
    
    // 선택 효과 보여주기
    this._showSelectionEffect(choice);
    
    // 1초 후 다음 씬으로 전환
    setTimeout(() => {
      if (this.isActive) {
        this.deactivate();
        this.sceneManager.transitionTo('votingBooth'); // 원래 투표소 씬으로
      }
    }, 1000);
  }

  _showSelectionEffect(choice) {
    // 선택 피드백 텍스트
    const feedback = document.createElement('div');
    Object.assign(feedback.style, {
      position: 'absolute',
      top: '75%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: choice === 'early' ? '#27ae60' : '#e74c3c',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      fontFamily: 'Malgun Gothic, sans-serif',
      opacity: '0',
      transition: 'opacity 0.5s ease-in-out'
    });
    
    feedback.textContent = choice === 'early' ? 
      '사전투표 선택! 👍' : 
      '당일투표 선택! 📊';
    
    this.choiceUIContainer.appendChild(feedback);
    
    // 피드백 페이드인
    setTimeout(() => {
      feedback.style.opacity = '1';
    }, 100);
    
    // 버튼들 비활성화
    this.choiceButtons.style.pointerEvents = 'none';
    this.choiceButtons.style.opacity = '0.5';
  }

  activate() {
    console.log('SceneVoteChoice activated');
    this.isActive = true;
    
    // UI 추가
    document.body.appendChild(this.choiceUIContainer);
    
    // 질문 텍스트 페이드인
    setTimeout(() => {
      this.questionText.style.opacity = '1';
    }, 500);
    
    // 버튼들 페이드인
    setTimeout(() => {
      this.choiceButtons.style.opacity = '1';
    }, 1000);
    
    // 2초 후 자동으로 다음 씬으로 (만약 사용자가 선택하지 않으면)
    this.autoProgressTimer = setTimeout(() => {
      if (this.isActive) {
        console.log('자동 진행: 시간 초과');
        this._selectChoice('election-day'); // 기본값으로 당일투표 선택
      }
    }, 5000); // 실제로는 5초로 여유를 둠
    
    // 장식 오브젝트 회전 애니메이션
    let rotation = 0;
    const animateDecor = () => {
      if (this.isActive) {
        rotation += 0.02;
        this.scene.children.forEach(child => {
          if (child.geometry && child.geometry.type === 'SphereGeometry') {
            child.rotation.y = rotation;
            child.position.y = 1 + Math.sin(rotation * 2) * 0.1;
          }
        });
        requestAnimationFrame(animateDecor);
      }
    };
    animateDecor();
  }

  deactivate() {
    console.log('SceneVoteChoice deactivated');
    this.isActive = false;
    
    // 타이머 정리
    if (this.autoProgressTimer) {
      clearTimeout(this.autoProgressTimer);
    }
    
    // UI 제거
    if (this.choiceUIContainer && this.choiceUIContainer.parentNode) {
      this.choiceUIContainer.parentNode.removeChild(this.choiceUIContainer);
    }
  }

  update(deltaTime) {
    // 투표함 미세한 움직임
    if (this.isActive) {
      const time = Date.now() * 0.001;
      const voteBox = this.scene.children.find(child => 
        child.geometry && child.geometry.type === 'BoxGeometry' && 
        child.position.z === -2
      );
      if (voteBox) {
        voteBox.rotation.y = Math.sin(time) * 0.05;
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