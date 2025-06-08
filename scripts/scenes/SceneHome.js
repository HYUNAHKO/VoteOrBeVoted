// SceneHome.js - 기존 구조에 맞춘 최소 수정 + 이동 조작 + 핸드폰 상호작용
import * as THREE from 'three';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export default class SceneHome {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.mixer = null;
    this.manualStartPosition = null;


    // 리스폰 관련 변수 
    this.shouldRespawn = false;

    
    // CSS2DRenderer 세팅
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.width = '100%';
    this.labelRenderer.domElement.style.height = '100%';
    this.labelRenderer.domElement.style.pointerEvents = 'none'; // 기본은 none
    this.labelRenderer.domElement.style.zIndex = '1000';
    document.body.appendChild(this.labelRenderer.domElement);

    this.assetsLoaded = false;
    this.bedroomModel = null;
    this.phoneModel = null;
    this.phoneUI = null; // CSS2DObject
    this.warningUI = null;

    // 이동 조작을 위한 변수들
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canLook = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    // 카메라 회전을 위한 별도 변수 (더 안정적인 제어)
    this.cameraYaw = 0;    // 좌우 회전
    this.cameraPitch = 0;  // 상하 회전
    
    // 방 정보 (에셋 로딩 후 설정됨)
    this.roomInfo = null;
    this.phoneGlow = null;

    // GLTF 로더 생성
    this.gltfLoader = new GLTFLoader();

    this._init();
  }

  _init() {
    // 1) 배경 
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // 2) 기본 조명만 (에셋 로드 전)
    this._setupBasicLighting();
    
    // 3) 텍스트 오버레이
    this._createTextOverlay();
    
    // 4) 실제 다운로드받은 에셋 로드
    this._loadActualBedroom();

  }

  
  async _loadActualBedroom() {
    try {
      console.log('🎯 실제 다운로드받은 방 에셋 로딩 중...');
      
      // 메인 파일만 로드
      const filePath = './assets/models/bedroom-scene.glb';
      
      console.log(`🔍 로딩: ${filePath}`);
      const loadedAsset = await this._loadGLTFDirect(filePath);
      console.log(`✅ 성공: ${filePath}`);
      
      // 성공적으로 로드된 에셋 처리
      this.bedroomModel = loadedAsset.scene;
      
      console.log('📐 에셋 정보:', {
        children: this.bedroomModel.children.length,
        animations: loadedAsset.animations?.length || 0
      });
      
      // 에셋 최적화
      this._optimizeLoadedAsset();
      
      // 씬에 추가
      this.scene.add(this.bedroomModel);
      
      // 에셋에 맞게 환경 조정
      this._adjustEnvironmentForAsset();
      
      // ✨ 방 내부에 카메라 자동 배치
      this._autoPositionCameraInside();
      
      this.assetsLoaded = true;
      
      console.log('🎉 실제 방 에셋 로딩 완료!');
      console.log('📷 카메라는 고정 위치 (0, 1.6, 5) 사용 중');
      
    } catch (error) {
      console.error('💥 방 에셋 로딩 실패:', error);
      console.error('💡 확인사항: assets/models/bedroom-scene.glb 파일이 있는지 체크해주세요');
    }
  }

  _loadGLTFDirect(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          resolve(gltf);
        },
        (progress) => {
          // 진행률은 콘솔에만 출력
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            console.log(`📊 로딩 진행률: ${percent}%`);
          }
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  _optimizeLoadedAsset() {
    if (!this.bedroomModel) return;
    
    // 그림자 설정
    this.bedroomModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // 머티리얼 최적화
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.needsUpdate = true;
            });
          } else {
            child.material.needsUpdate = true;
          }
        }
      }
    });
    
    console.log('✅ 에셋 최적화 완료');
  }

  _adjustEnvironmentForAsset() {
    // 기존 기본 조명 제거
    const lightsToRemove = [];
    this.scene.traverse((child) => {
      if (child.isLight) {
        lightsToRemove.push(child);
      }
    });
    lightsToRemove.forEach(light => this.scene.remove(light));
    
    // 에셋에 맞는 조명 설정
    
    // 1) 부드러운 주변광
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // 2) 주 방향광 (자연스러운 느낌)
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);
    
    // 3) 보조 포인트 라이트
    const fillLight = new THREE.PointLight(0xffd4a3, 0.4, 20);
    fillLight.position.set(-5, 3, 2);
    this.scene.add(fillLight);
    
    // 4) 배경색 조정 (에셋에 어울리게)
    this.scene.background = new THREE.Color(0xf8f8f8);
    
    console.log('✅ 환경 조명 설정 완료');
  }

  // 방 내부에 카메라 자동 배치
  _autoPositionCameraInside() {
    // 1) 메시만 모아서 정제된 바운딩박스 계산
    const box = new THREE.Box3();
    this.bedroomModel.traverse(child => {
        if (child.isMesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const geomBox = child.geometry.boundingBox.clone();
        geomBox.applyMatrix4(child.matrixWorld);
        box.union(geomBox);
        }
    });

    // 2) 박스에서 중심(center)과 크기(size) 구하기
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    console.log('🏠 정제된 방 바운딩:', box.min, box.max);

    // 3) 수동 시작 위치로 덮어쓰기
    const manualStart = new THREE.Vector3(104.98, 50, 499.92);
    this.camera.position.copy(manualStart);
    this.camera.lookAt(center);
    this.cameraYaw   = 0;
    this.cameraPitch = 0;

    // 4) roomInfo 갱신
    this.roomInfo = { center, size, box };

    console.log('📷 수동 카메라 위치:', manualStart);
  }

  _setupBasicLighting() {
    // 로딩 중 최소한의 조명
    const tempLight = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(tempLight);
  }

  _createTextOverlay() {
    this.textOverlay = document.createElement('div');
    this.textOverlay.id = 'home-text';
    Object.assign(this.textOverlay.style, {
      position: 'absolute',
      top: '10%',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
      opacity: '0',
      transition: 'opacity 1.5s ease-in-out',
      zIndex: '1000',
      fontFamily: 'Malgun Gothic, sans-serif',
      background: 'rgba(0,0,0,0.6)',
      padding: '20px 30px',
      borderRadius: '10px',
      backdropFilter: 'blur(5px)'
    });
    this.textOverlay.innerHTML = `
      🏠 집에서 뒹굴거리면서 투표나 해볼까?<br/>
      <div style="font-size: 16px; margin-top: 15px; color: #ccc;">
        📱 핸드폰을 클릭해서 투표하기<br/>
        🎮 WASD로 이동 + 우클릭 드래그로 시점 변경
      </div>
    `;
  }

  // 기존 구조에 맞춘 onEnter 메서드
  onEnter() {
    console.log('SceneHome onEnter');

    // 1) 초기 로딩 전 기본 위치 세팅
    if (!this.assetsLoaded) {
        this.camera.position.set(0, 2, 8);
        this.camera.rotation.set(0, 0, 0);
        this.camera.lookAt(0, 1, 0);
        this.camera.updateProjectionMatrix();
    }
    this.cameraYaw = 0;
    this.cameraPitch = 0;

    // 2) 조작 이벤트 등록, UI 추가 등
    this._setupControls();
    document.body.appendChild(this.textOverlay);

    // 3) 에셋 로딩 완료 후 강제 수동 위치 재적용
    const startScene = () => {
        if (this.assetsLoaded) {
        console.log('📷 방 내부 카메라 배치 완료 (자동 & 수동 적용)');
        // 핸드폰 추가
        this._addPhoneToDesk();

        // 수동 좌표로 재세팅
        this.camera.position.set(104.98, 50, 499.92);
        this.camera.lookAt(this.roomInfo.center);
        console.log('📷 startScene: 수동 카메라 위치 재세팅:', this.camera.position);

        // 텍스트 페이드인/out 등
        setTimeout(() => this.textOverlay.style.opacity = '1', 800);
        setTimeout(() => this.textOverlay.style.opacity = '0', 5000);
        } else {
        setTimeout(startScene, 100);
        }
    };
    startScene();
    }


  // 기존 구조에 맞춘 onExit 메서드
  onExit() {
    console.log('SceneHome onExit');
    
    // UI 제거
    if (this.textOverlay && this.textOverlay.parentNode) {
      this.textOverlay.parentNode.removeChild(this.textOverlay);
    }
    this._hideWarningUI();
    // 이동 조작 이벤트 제거
    this._removeControls();
  }

  // 3D 위에 HTML 패널 띄우기
  _showPhoneUI() {
    if (!this.phoneUI) {
      const container = document.createElement('div');
      Object.assign(container.style, {
        width: '500px', height: '650px', padding: '15px', 
        background: 'rgba(255,255,255,0.95)',
        color: '#222', pointerEvents: 'auto', borderRadius: '15px', 
        fontFamily: 'Malgun Gothic, sans-serif',
        fontSize: '16px', boxShadow: '0 12px 24px rgba(0,0,0,0.4)', 
        overflow: 'hidden', zIndex: '1000',
        border: '2px solid #ddd'
      });
      container.style.display = 'flex';
      container.style.gap = '16px';
      
      container.innerHTML = `
        <!-- 좌측 패널 -->
        <div id="left-panel" style="
            flex:2; display:flex; flex-direction:column;
            padding:12px; overflow:auto;
            background: #f8f9fa; border-radius: 8px;
          ">
          <h2 style="margin-top:0; font-size:20px; color:#2c3e50;">📱 투표 정보 확인</h2>
          <div id="candidate-list">
            <h3 style="font-size:18px; color:#34495e; margin-bottom:12px;">🗳️ 후보자 공약</h3>
          </div>
          <div id="public-opinion" style="margin-top:16px;">
            <h3 style="font-size:18px; color:#34495e; margin-bottom:8px;">💬 여론 확인</h3>
            <button id="open-opinion"
              style="margin-top:8px; padding:12px 16px; background:#5dade2; color:#fff;
                     border:none; border-radius:6px; cursor:pointer; font-size:14px;
                     font-weight:bold; width:100%;">
              📰 기사 및 댓글 보기
            </button>
          </div>
          <button id="go-vote"
            style="margin-top:10px; width:100%; padding:16px;
                   background:#e74c3c; color:#fff; border:none;
                   border-radius:8px; cursor:pointer; font-size:16px; font-weight:bold;">
            🗳️ 투표 하러 가기
          </button>
        </div>

        <!-- 우측 패널 -->
        <div id="right-panel" style="
            flex:1; padding:16px; overflow:auto;
            max-height:200px;
            background: #fafafa; border:1px solid #ddd;
            border-radius:8px; line-height:1.6; font-size:14px;
          ">
          <h3 style="margin-top:0; color:#2c3e50;">📝 공식 공약 확인 방법</h3>
          <ol style="padding-left:18px;">
            <li style="margin-bottom:12px;">
              중앙선거관리위원회 '정책·공약마당'<br/>
              <a href="https://policy.nec.go.kr" target="_blank"
                 style="color:#3498db; text-decoration:none;">policy.nec.go.kr</a><br/>
              <small style="color:#666;">• PDF 공약 전문 다운로드</small>
            </li>
            <li>
              대통령선거 특집 홈페이지<br/>
              <a href="https://vt.nec.go.kr" target="_blank"
                 style="color:#3498db; text-decoration:none;">vt.nec.go.kr</a><br/>
              <small style="color:#666;">• 후보 정보·투표소 안내</small>
            </li>
          </ol>
          
          <div style="background:#e8f4f8; padding:12px; border-radius:6px; margin-top:16px;">
            <p style="margin:0; font-size:13px; color:#2c3e50;">
              💡 <strong>팁:</strong> 정확한 정보는 공식 채널에서 확인하세요!
            </p>
          </div>
        </div>
      `;

      // 후보 목록 추가
      const candidates = [
        { key:'A', name:'김후보', policies:[
            '교육비 전면 무상화 추진',
            '청년 일자리 50만개 창출 계획 발표',
            '탈원전·신재생에너지 확대',
            '부동산 투기 근절법안 발의'
          ]
        },
        { key:'B', name:'이후보', policies:[
            '국민 건강보험 보장성 강화',
            'K-교통 인프라 4차 확충',
            '중소기업 혁신 펀드 1조원 조성',
            '디지털 규제 샌드박스 운영'
          ]
        },
        { key:'C', name:'박후보', policies:[
            '기초연금 30% 인상',
            '문화예술진흥 특별법 제정',
            '공공와이파이 전국 확충',
            '인공지능 윤리기준 마련'
          ]
        }
      ];
      
      const listEl = container.querySelector('#candidate-list');
      candidates.forEach(c => {
        const btn = document.createElement('button');
        btn.innerText = `${c.key}. ${c.name}`;
        Object.assign(btn.style, {
          display:'block', width:'100%', margin:'6px 0',
          padding:'10px', background:'#3498db', color:'#fff',
          border:'none', borderRadius:'6px', cursor:'pointer',
          textAlign:'left', fontSize:'14px', fontWeight:'bold'
        });
        btn.onclick = () => this._showCandidatePolicies(c, container);
        listEl.appendChild(btn);
      });

      // 기사 보기
      container.querySelector('#open-opinion').addEventListener('click', () => {
        // 1) 기존 기사+댓글 화면으로 전환
        this._showPublicOpinion(container);
        
        // 2) 동시에 Warning UI도 띄우기
        setTimeout(() => {
            this._showWarningUI();
        }, 100); // 살짝 딜레이를 주어 안정적으로 생성
        });
      // 투표일 선택
      container.querySelector('#go-vote').addEventListener('click', () => this._showVoteDayChoice(container));

      this.phoneUI = new CSS2DObject(container);
      this.phoneUI.position.set(0, 1, 0);
      this.phoneModel.add(this.phoneUI);
    }
    this.phoneUI.element.style.display = '';
  }

  _showCandidatePolicies(candidate, container) {
    container.innerHTML = `
      <h2>${candidate.key}. ${candidate.name} 주요 공약</h2>
      <ul style="padding-left:18px;">${candidate.policies.map(p=>`<li>${p}</li>`).join('')}</ul>
      <button id="back-cand" style="margin-top:12px;padding:8px;background:#aaa;color:#fff;border:none;border-radius:4px;cursor:pointer;">뒤로</button>
    `;
    container.querySelector('#back-cand').onclick = () => {
        // 기존 UI 제거 후 다시 생성
        this.phoneModel.remove(this.phoneUI);
        this.phoneUI = null;
        this._showPhoneUI();
      };
  }
  _showWarningUI() {
    if (!this.warningUI) {
      const warningContainer = document.createElement('div');
      Object.assign(warningContainer.style, {
        width: '600px', 
        height: '700px', 
        padding: '24px',
        background: 'rgba(255,255,255,0.98)',
        color: '#222', 
        pointerEvents: 'auto', 
        borderRadius: '15px', 
        fontFamily: 'Malgun Gothic, sans-serif',
        fontSize: '15px', 
        boxShadow: '0 16px 32px rgba(0,0,0,0.5)', 
        overflow: 'hidden', 
        zIndex: '1001', // phoneUI보다 높게
        border: '3px solid #e74c3c', // 경고 색상
        position: 'relative'
      });
      
      const closeButton = document.createElement('button');
      closeButton.id = 'close-warning';
      closeButton.innerHTML = '×';
      Object.assign(closeButton.style, {
        position: 'absolute',
        top: '16px',
        right: '16px',
        background: '#e74c3c',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        cursor: 'pointer',
        fontSize: '20px',
        fontWeight: 'bold',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10'
    });
      warningContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2 style="margin:0; color:#e74c3c; font-size:22px;">⚖️ 선거 비방 처벌 안내</h2>
          <button id="close-warning" style="
            background:#e74c3c; color:#fff; border:none; 
            border-radius:50%; width:32px; height:32px; 
            cursor:pointer; font-size:18px; font-weight:bold;
          ">×</button>
        </div>

        <div id="warning-content" style="
          height: calc(100% - 80px); 
          overflow-y: scroll; 
          padding-right: 8px;
          line-height: 1.6;
        ">
          <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h3 style="margin-top:0; color:#856404;">🚨 중요 공지</h3>
            <p style="margin:0; font-weight:bold;">
              온라인에서 선거 관련 댓글 작성 시 <span style="color:#dc3545;">법적 처벌</span>을 받을 수 있습니다.
            </p>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #3498db; padding-bottom:8px;">📋 주요 처벌 조항</h3>
          <div style="display:grid; gap:12px; margin-bottom:24px;">
            <div style="background:#f8f9fa; padding:16px; border-radius:8px; border-left:4px solid #dc3545;">
              <h4 style="margin-top:0; color:#dc3545;">후보자비방죄 (제251조)</h4>
              <ul style="margin:0; padding-left:20px;">
                <li><strong>처벌:</strong> 3년 이하 징역 또는 500만원 이하 벌금</li>
                <li><strong>대상:</strong> 후보자를 비방하는 글, 댓글, 영상 등</li>
                <li><strong>범위:</strong> 사실 여부와 관계없이 비방 목적이면 처벌</li>
              </ul>
            </div>
            
            <div style="background:#f8f9fa; padding:16px; border-radius:8px; border-left:4px solid #e74c3c;">
              <h4 style="margin-top:0; color:#e74c3c;">허위사실공표죄 (제250조)</h4>
              <ul style="margin:0; padding-left:20px;">
                <li><strong>처벌:</strong> 5년 이하 징역 또는 3천만원 이하 벌금</li>
                <li><strong>대상:</strong> 거짓 정보로 후보자 당락에 영향을 미치는 행위</li>
                <li><strong>범위:</strong> SNS, 댓글, 메신저 등 모든 온라인 활동</li>
              </ul>
            </div>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #28a745; padding-bottom:8px;">🚨 실제 처벌 사례</h3>
          <div style="background:#fff3cd; padding:16px; border-radius:8px; margin-bottom:20px;">
            <ul style="margin:0; padding-left:20px; font-size:14px;">
              <li style="margin-bottom:8px;">온라인 커뮤니티 악성 댓글 → <strong>벌금 200만원</strong></li>
              <li style="margin-bottom:8px;">SNS 허위 정보 유포 → <strong>징역 6개월</strong></li>
              <li style="margin-bottom:8px;">유튜브 비방 영상 업로드 → <strong>벌금 500만원</strong></li>
              <li style="margin-bottom:8px;">인스타그램 허위 해시태그 → <strong>벌금 300만원</strong></li>
              <li>페이스북 후보자 인신공격 → <strong>벌금 150만원</strong></li>
            </ul>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #17a2b8; padding-bottom:8px;">✅ 건전한 참여 방법</h3>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
            <div style="background:#d1ecf1; padding:12px; border-radius:6px;">
              <h4 style="margin-top:0; color:#0c5460;">권장사항</h4>
              <ul style="margin:0; padding-left:16px; font-size:13px;">
                <li>정책 중심의 건설적 토론</li>
                <li>사실에 근거한 의견 표명</li>
                <li>상대 후보 존중하는 표현</li>
                <li>출처 명확한 정보 공유</li>
              </ul>
            </div>
            <div style="background:#f8d7da; padding:12px; border-radius:6px;">
              <h4 style="margin-top:0; color:#721c24;">금지사항</h4>
              <ul style="margin:0; padding-left:16px; font-size:13px;">
                <li>인신공격성 발언</li>
                <li>허위사실 유포</li>
                <li>감정적 비방 댓글</li>
                <li>근거 없는 추측성 글</li>
              </ul>
            </div>
          </div>

          <h3 style="color:#2c3e50; border-bottom:2px solid #6c757d; padding-bottom:8px;">📞 신고 및 문의</h3>
          <div style="background:#e2e3e5; padding:16px; border-radius:8px; margin-bottom:20px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:14px;">
              <div>
                <strong>🏛️ 중앙선거관리위원회</strong><br/>
                전화: 02-503-1114<br/>
                웹사이트: www.nec.go.kr
              </div>
              <div>
                <strong>💻 사이버선거범죄신고센터</strong><br/>
                전화: 1390<br/>
                웹사이트: cyber.nec.go.kr
              </div>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white; padding:20px; border-radius:10px; text-align:center;">
            <h3 style="margin-top:0; color:white;">🗳️ 건전한 선거문화를 만들어요!</h3>
            <p style="margin:0; font-size:14px; opacity:0.9;">
              비방과 허위정보가 아닌, 정책과 비전으로 후보를 평가하는 성숙한 민주주의를 실현합시다.
            </p>
          </div>
        </div>
      `;

    // X 버튼을 컨테이너에 추가
    warningContainer.appendChild(closeButton);

    closeButton.addEventListener('click', (e) => {
        console.log('❌ X 버튼 클릭 이벤트 발생!');
        e.preventDefault();
        e.stopPropagation();
        
        // 즉시 실행
        setTimeout(() => {
        console.log('🔧 _hideWarningUI 실행 중...');
        this._hideWarningUI();
        }, 0);
    });

    // 🔧 추가 안전장치 - mousedown으로도 처리
    closeButton.addEventListener('mousedown', (e) => {
        console.log('❌ X 버튼 mousedown 이벤트!');
        e.preventDefault();
        e.stopPropagation();
        this._hideWarningUI();
    });

      // 스크롤바 스타일링
      const style = document.createElement('style');
      style.textContent = `
        #warning-content::-webkit-scrollbar {
          width: 8px;
        }
        #warning-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        #warning-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        #warning-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `;
      if (!document.querySelector('#warning-scroll-style')) {
        style.id = 'warning-scroll-style';
        document.head.appendChild(style);
      }

      this.warningUI = new CSS2DObject(warningContainer);
      // 핸드폰 UI 옆에 배치 (오른쪽으로 이동)
      this.warningUI.position.set(25.0, 1, 0); // phoneUI보다 오른쪽에 배치
      this.phoneModel.add(this.warningUI);
    }
    
    this.warningUI.element.style.display = '';
    console.log('⚖️ 비방 처벌 안내 UI 표시');
  }

  // 🔧 비방 처벌 안내 UI 숨기기
  _hideWarningUI() {
    if (this.warningUI) {
      this.warningUI.element.style.display = 'none';
      console.log('⚖️ 비방 처벌 안내 UI 숨김');
    }

    if (this.phoneModel && this.warningUI.parent === this.phoneModel) {
      this.phoneModel.remove(this.warningUI);
      console.log('🔧 phoneModel에서 warningUI 제거 완료');
    }
  }
  // 여론 확인: 좌/우 패널 모두 업데이트
  _showPublicOpinion(container) {
    // 좌측 패널 채우기
    const left = container.querySelector('#left-panel');
    left.innerHTML = `
        <h2 style="margin-top:0;">📰 최신 기사</h2>
        <div id="articles" style="flex:1; overflow-y:auto; margin-bottom:8px;"></div>
        <h3 style="margin:8px 0 4px;">댓글</h3>
        <div id="comments" style="flex:1; overflow-y:auto; margin-bottom:8px;"></div>
        <textarea id="new-comment" placeholder="댓글 작성..." style="
        width:100%; height:60px; box-sizing:border-box;
        padding:6px; border:1px solid #aaa; border-radius:4px;
        "></textarea>
        <button id="submit-comment" style="
        margin-top:6px; padding:8px; background:#3498db; color:#fff;
        border:none; border-radius:4px; cursor:pointer;
        ">댓글 제출</button>
  `;

    const articles = [
      { title:'A 후보, 심각한 부패 의혹 제기', content:'최근 언론 보도에 따르면 A 후보의 측근들이 대규모 뇌물 수수 정황이 포착되었습니다...' },
      { title:'B 후보, 대중교통 예산 삭감 논란', content:'이 후보의 예산안이 서울 시내버스·지하철 예산을 30% 삭감한다고 발표해 논란이 일고 있습니다...' }
    ];
    const artDiv = left.querySelector('#articles');
    articles.forEach(a => {
        const el = document.createElement('div');
        el.style.marginBottom = '12px';
        el.innerHTML = `<strong>${a.title}</strong><p style="margin:4px 0;">${a.content}</p>`;
        artDiv.appendChild(el);
    });

    // 댓글 섹션
    const cmDiv = left.querySelector('#comments');
    const comments = [ { text:'👤 정말 충격이네요...', likes:12, dislikes:3 }, { text:'👤 사실 확인이 필요합니다.', likes:8, dislikes:2 } ];
    comments.forEach((c,i) => {
    const wrap = document.createElement('div');
    wrap.style.marginBottom = '8px';
    wrap.innerHTML = `
      <p style="margin:0 0 4px;">${c.text}</p>
      <button id="like${i}">👍 ${c.likes}</button>
      <button id="dis${i}">👎 ${c.dislikes}</button>
    `;
    cmDiv.appendChild(wrap);
    wrap.querySelector(`#like${i}`)
        .onclick = () => wrap.querySelector(`#like${i}`)
                        .innerText = `👍 ${++c.likes}`;
    wrap.querySelector(`#dis${i}`)
        .onclick = () => wrap.querySelector(`#dis${i}`)
                        .innerText = `👎 ${++c.dislikes}`;
    });

    // 댓글 제출 로직 
    left.querySelector('#submit-comment').onclick = (e) => {
    try {
      e.preventDefault(); // 기본 동작 방지
      
      const textArea = left.querySelector('#new-comment');
      const text = textArea.value.trim();
      
      console.log('📝 댓글 제출:', text); // 디버깅용
      
      if (!text) {
        alert('댓글을 입력해주세요.');
        return;
      }
      
      // 🚨 비방 댓글 체크 (더 정확한 체크)
      const badWords = ['비방', '욕설', '인신공격', '거짓말쟁이', '무능한', '바보', '멍청이', '쓰레기', '개새끼', '병신'];
      const hasBadWord = badWords.some(word => text.includes(word));
      
      if (hasBadWord) {
        // 🔧 처벌 메시지와 함께 리스폰 위치 설정
        alert('비방성 댓글은 처벌받을 수 있습니다. 메인 화면으로 돌아갑니다.');
          
        // 1) 카메라 위치를 리스폰 지점으로 미리 설정
        const respawnPosition = new THREE.Vector3(104.98, 50, 499.92);
        this.camera.position.copy(respawnPosition);
        this.camera.lookAt(this.roomInfo.center);
        this.cameraYaw = 0;
        this.cameraPitch = 0;
        this._updateCameraRotation();

        console.log('🚨 비방 댓글 감지! 리스폰 위치로 이동:', respawnPosition);

        // 2) UI 정리
        this._hideWarningUI();
        if (this.phoneUI) {
            this.phoneModel.remove(this.phoneUI);
            this.phoneUI = null;
        }

        // 3) 홈으로 전환 (카메라는 이미 리스폰 위치에 설정됨)
        this.sceneManager.transitionTo('home');
        return;
        }
      
      // 정상 댓글 추가
      const commentsDiv = left.querySelector('#comments');
      if (commentsDiv) {
        const newComment = document.createElement('div');
        newComment.style.marginBottom = '8px';
        newComment.style.padding = '8px';
        newComment.style.background = '#e8f5e8'; // 새 댓글은 연한 초록색
        newComment.style.borderRadius = '4px';
        newComment.style.border = '1px solid #4caf50';
        
        newComment.innerHTML = `
          <p style="margin:0 0 4px;">👤 ${text}</p>
          <div style="display:flex; gap:8px;">
            <button style="padding:4px 8px; background:#e3f2fd; border:1px solid #2196f3; border-radius:3px; cursor:pointer;" disabled>
              👍 0
            </button>
            <button style="padding:4px 8px; background:#ffebee; border:1px solid #f44336; border-radius:3px; cursor:pointer;" disabled>
              👎 0
            </button>
          </div>
          <small style="color:#666; font-size:11px;">방금 전</small>
        `;
        
        // 새 댓글을 맨 위에 추가
        commentsDiv.insertBefore(newComment, commentsDiv.firstChild);
        
        // 입력창 초기화
        textArea.value = '';
        
        console.log('✅ 댓글 추가 완료'); // 디버깅용
        
        // 성공 알림
        const submitBtn = left.querySelector('#submit-comment');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = '✅ 등록완료';
        submitBtn.style.background = '#28a745';
        setTimeout(() => {
          submitBtn.innerText = originalText;
          submitBtn.style.background = '#3498db';
        }, 1000);
        
      } else {
        console.error('❌ 댓글 컨테이너를 찾을 수 없습니다');
      }
      
    } catch (error) {
      console.error('❌ 댓글 제출 중 오류:', error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  // 뒤로가기 버튼을 컨테이너 밖으로 이동
  if (!container.querySelector('#back-opinion')) {
    const back = document.createElement('button');
    back.id = 'back-opinion';
    back.innerText = '← 뒤로';
    Object.assign(back.style, {
      position: 'absolute',
      bottom: '15px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      background: '#6c757d',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      zIndex: '20',
      fontWeight: 'bold',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    });
    back.onclick = () => {
      this.phoneModel.remove(this.phoneUI);
      this.phoneUI = null;
      this._showPhoneUI();
    };
    container.appendChild(back);
  }
}

  _showVoteDayChoice(container) {
    container.innerHTML = `
      <h2>🗓️ 언제 투표하시나요?</h2>
      <button id="early" style="width:100%;padding:10px;margin:8px 0;background:#28a745;color:#fff;border:none;border-radius:6px;cursor:pointer;">사전투표일</button>
      <button id="main" style="width:100%;padding:10px;margin:8px 0;background:#dc3545;color:#fff;border:none;border-radius:6px;cursor:pointer;">본 투표일</button>
      <button id="back-vote" style="margin-top:12px;padding:8px;background:#aaa;color:#fff;border:none;border-radius:4px;cursor:pointer;">뒤로</button>
    `;
    container.querySelector('#early').onclick = () => this.sceneManager.transitionTo('earlyVote');
    container.querySelector('#main').onclick = () => this.sceneManager.transitionTo('mainVote');
    container.querySelector('#back-vote').onclick = () => {
        this.phoneModel.remove(this.phoneUI);
        this.phoneUI = null;
        this._showPhoneUI();
      };
  }

  // 이동 조작 설정
  _setupControls() {
    // 키보드 이벤트
    this.onKeyDown = (event) => {
      switch(event.code) {
        case 'KeyW': case 'ArrowUp':
          this.moveForward = true;
          break;
        case 'KeyS': case 'ArrowDown':
          this.moveBackward = true;
          break;
        case 'KeyA': case 'ArrowLeft':
          this.moveLeft = true;
          break;
        case 'KeyD': case 'ArrowRight':
          this.moveRight = true;
          break;
          
      }
    };
    
    this.onKeyUp = (event) => {
      switch(event.code) {
        case 'KeyW': case 'ArrowUp':
          this.moveForward = false;
          break;
        case 'KeyS': case 'ArrowDown':
          this.moveBackward = false;
          break;
        case 'KeyA': case 'ArrowLeft':
          this.moveLeft = false;
          break;
        case 'KeyD': case 'ArrowRight':
          this.moveRight = false;
          break;
      }
    };
    
    // 마우스 이벤트 (우클릭으로 시점 변경)
    this.onMouseDown = (event) => {
      if (event.button === 2) { // 우클릭
        this.canLook = true;
        this.prevMouseX = event.clientX;
        this.prevMouseY = event.clientY;
        document.body.style.cursor = 'grab';
      }
    };
    
    this.onMouseUp = (event) => {
      if (event.button === 2) {
        this.canLook = false;
        document.body.style.cursor = 'default';
      }
    };
    
    this.onMouseMove = (event) => {
      if (this.canLook) {
        const deltaX = event.clientX - this.prevMouseX;
        const deltaY = event.clientY - this.prevMouseY;
        
        // yaw/pitch 변수로 회전 관리
        this.cameraYaw -= deltaX * 0.002;
        this.cameraPitch -= deltaY * 0.002;
        
        // 상하 시점 제한
        this.cameraPitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.cameraPitch));
        
        // 카메라 회전 적용
        this._updateCameraRotation();
        
        this.prevMouseX = event.clientX;
        this.prevMouseY = event.clientY;
      }
    };
    
    // 클릭 이벤트 (핸드폰 상호작용)
    this.onMouseClick = (event) => {
      if (event.button === 0 && this.phoneModel) { // 좌클릭
        this._checkPhoneClick(event);
      }
    };
    
    // 이벤트 등록
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('click', this.onMouseClick);
    
    // 우클릭 메뉴 비활성화
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
  }

  _removeControls() {
    if (this.onKeyDown) {
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      document.removeEventListener('mousedown', this.onMouseDown);
      document.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('click', this.onMouseClick);
    }
    document.body.style.cursor = 'default';
  }

  // 기존 구조에 맞춘 update 메서드
  update() {
    // 이동 처리
    this._handleMovement();
    
    // 에셋이 로드된 경우에만 업데이트
    if (this.assetsLoaded && this.bedroomModel) {
      const time = Date.now() * 0.001;
      
      // 조명 미세 조정
      this.scene.traverse((child) => {
        if (child.type === 'PointLight') {
          const baseIntensity = child.userData.baseIntensity || child.intensity;
          child.userData.baseIntensity = baseIntensity;
          child.intensity = baseIntensity + Math.sin(time * 1.5) * 0.05;
        }
      });
      
      // 핸드폰 glow 효과 (깜빡임)
      if (this.phoneGlow) {
        this.phoneGlow.material.opacity = 0.1 + Math.sin(time * 3) * 0.1;
      }
    }
  }

  _handleMovement() {
    const moveSpeed = 0.5;
    
    // 카메라의 현재 회전에 따른 방향 벡터 계산
    const forward = new THREE.Vector3(
      -Math.sin(this.cameraYaw),
      0,
      -Math.cos(this.cameraYaw)
    ).normalize();
    
    const right = new THREE.Vector3(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw)
    ).normalize();
    
    // 이동 처리
    const movement = new THREE.Vector3(0, 0, 0);
    let moved = false;
    
    if (this.moveForward) {
      movement.add(forward.clone().multiplyScalar(moveSpeed));
      moved = true;
    }
    if (this.moveBackward) {
      movement.add(forward.clone().multiplyScalar(-moveSpeed));
      moved = true;
    }
    if (this.moveLeft) {
      movement.add(right.clone().multiplyScalar(-moveSpeed));
      moved = true;
    }
    if (this.moveRight) {
      movement.add(right.clone().multiplyScalar(moveSpeed));
      moved = true;
    }
    
    // 카메라 위치 업데이트
    if (moved) {
      this.camera.position.add(movement);
      
      // 이동할 때마다 위치 출력 (디버깅용)
      if (Date.now() % 500 < 16) { // 0.5초마다 한 번씩만 출력
        console.log('🚶 현재 위치:', {
          x: Math.round(this.camera.position.x * 100) / 100,
          y: Math.round(this.camera.position.y * 100) / 100,
          z: Math.round(this.camera.position.z * 100) / 100
        });
      }
    }
  }

  // 카메라 회전 업데이트 (새 함수 추가)
  _updateCameraRotation() {
    // yaw와 pitch를 사용해서 카메라가 바라볼 방향 계산
    const lookDirection = new THREE.Vector3(
      -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    );
    
    // 카메라가 바라볼 타겟 위치 계산
    const target = this.camera.position.clone().add(lookDirection);
    
    // lookAt으로 카메라 방향 설정
    this.camera.lookAt(target);
  }

  // 책상 위에 핸드폰 추가 
  _addPhoneToDesk() {
    // 폰 모델 생성 (박스 형태)
    const phoneGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.01);
    const phoneMaterial = new THREE.MeshPhongMaterial({
        color: 0x2c2c2c,
        shininess: 100
    });
    this.phoneModel = new THREE.Mesh(phoneGeometry, phoneMaterial);

    // 1) 스케일 조정 (30배)
    const scaleFactor = 30;
    this.phoneModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // 2) 폰을 가로로 눕히기 (X축 90도 회전)
    this.phoneModel.rotation.x = -Math.PI / 2;

    // 3) 수동 위치 설정
    const manualPhonePos = new THREE.Vector3(146.46, 25, 382.79);
    this.phoneModel.position.copy(manualPhonePos);
    console.log('📱 수동 핸드폰 위치 및 방향 설정:', manualPhonePos, this.phoneModel.rotation);

    // 4) 그림자 및 클릭 이벤트 설정
    this.phoneModel.castShadow = true;
    this.phoneModel.userData = { clickable: true, action: 'phoneCheck' };
    this.scene.add(this.phoneModel);

    // 5) 글로우 효과 생성 (크기 확대)
    const glowRadius = 0.5;
    const glowGeometry = new THREE.SphereGeometry(glowRadius, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    // 폰 스케일에 맞춰 글로우도 스케일링
    glow.scale.set(scaleFactor, scaleFactor, scaleFactor);
    glow.position.copy(manualPhonePos);
    this.scene.add(glow);
    this.phoneGlow = glow;
    }

  // 핸드폰 클릭 체크
  _checkPhoneClick(event) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );
  raycaster.setFromCamera(mouse, this.camera);
  const intersects = raycaster.intersectObject(this.phoneModel);
  if (intersects.length > 0) {
    console.log('📱 핸드폰 클릭됨!');
    
    // 클릭 시 Emissive 효과 
    this.phoneModel.material.emissive.setHex(0x444444);
    setTimeout(() => {
      this.phoneModel.material.emissive.setHex(0x000000);
    }, 200);
    
    // 화면 전환 대신 UI 띄우기
    this._showPhoneUI();
  }
}

  // 기존 구조에 맞춘 render 메서드
  render() {
    // 배경색 설정 등
    this.renderer.setClearColor(this.assetsLoaded ? 0xf8f8f8 : 0x1a1a1a);
    // Warning UI 상태 확인
    const hasWarningUI = this.warningUI && 
                        this.warningUI.element && 
                        this.warningUI.element.style.display !== 'none';
    
    if (hasWarningUI) {
        this.labelRenderer.domElement.style.pointerEvents = 'auto';
    } else {
        this.labelRenderer.domElement.style.pointerEvents = 'none';
    }
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    this.labelRenderer.render(this.scene, this.camera);
  }

}