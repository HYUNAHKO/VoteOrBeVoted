// ScenePhoneCheck.js - 핸드폰으로 공약 확인하는 씬
import * as THREE from 'three';

export default class ScenePhoneCheck {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.isActive = false;
    this.timer = 20;
    this.timerInterval = null;
    this.phoneUIContainer = null;
    this._init();
  }

  _init() {
    // 씬 배경 및 조명, 폰 모델 초기화
    this.scene.background = new THREE.Color(0x1a1a1a);
    this._setupLighting();
    this._createPhone();
    // 카메라 기본 시점
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);
  }

  _setupLighting() {
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambient);
    const phoneLight = new THREE.PointLight(0x6699ff, 1, 5);
    phoneLight.position.set(0, 0, 1);
    this.scene.add(phoneLight);
  }

  _createPhone() {
    const geo = new THREE.BoxGeometry(1.2, 2.2, 0.1);
    const mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.phone = new THREE.Mesh(geo, mat);
    this.scene.add(this.phone);
    const screenGeo = new THREE.PlaneGeometry(1, 1.8);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x6699ff, transparent: true, opacity: 0.8 });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.z = 0.06;
    this.phone.add(screen);
    const btnGeo = new THREE.CircleGeometry(0.08, 16);
    const btnMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const homeBtn = new THREE.Mesh(btnGeo, btnMat);
    homeBtn.position.set(0, -1.2, 0.06);
    this.phone.add(homeBtn);

    // 클릭 시 scene 활성화
    this.phone.userData = { clickable: true, action: 'openPhoneCheck' };
  }

  _createPhoneUI() {
    // UI 컨테이너
    this.phoneUIContainer = document.createElement('div');
    Object.assign(this.phoneUIContainer.style, { position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1000 });

    // 타이머 디스플레이
    this.timerDisplay = document.createElement('div');
    Object.assign(this.timerDisplay.style, { position:'absolute',top:'20px',right:'20px',color:'white',fontSize:'18px',fontWeight:'bold',fontFamily:'Malgun Gothic, sans-serif',background:'rgba(0,0,0,0.5)',padding:'5px 10px',borderRadius:'5px',pointerEvents:'auto' });
    this.phoneUIContainer.appendChild(this.timerDisplay);

    // 화면 오버레이
    this.phoneScreen = document.createElement('div');
    Object.assign(this.phoneScreen.style, { position:'absolute',top:'50%',left:'50%',transform:'translate(-50%, -50%)',width:'300px',height:'500px',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',borderRadius:'20px',padding:'20px',boxShadow:'0 10px 30px rgba(0,0,0,0.5)',pointerEvents:'auto',color:'white',fontFamily:'Malgun Gothic, sans-serif',overflow:'hidden' });
    this.phoneUIContainer.appendChild(this.phoneScreen);

    // 타이틀
    const title = document.createElement('div');
    title.textContent = '📱 투표 정보 확인';
    Object.assign(title.style, { fontSize:'18px',fontWeight:'bold',textAlign:'center',marginBottom:'20px',paddingBottom:'10px',borderBottom:'1px solid rgba(255,255,255,0.3)' });
    this.phoneScreen.appendChild(title);

    // 후보 리스트 및 여론 섹션
    this._createCandidateList();
    this._createPublicOpinionSection();

    // 투표 버튼
    const goBtn = document.createElement('button');
    goBtn.textContent = '투표 하러 가기';
    Object.assign(goBtn.style, { position:'absolute',bottom:'20px',left:'50%',transform:'translateX(-50%)',padding:'10px 20px',fontSize:'16px',background:'#fff',color:'#333',border:'none',borderRadius:'5px',cursor:'pointer',pointerEvents:'auto' });
    goBtn.addEventListener('click', () => this._showPreVoteChoice());
    this.phoneScreen.appendChild(goBtn);

    document.body.appendChild(this.phoneUIContainer);
  }

  _createCandidateList() {
    const sec = document.createElement('div');
    sec.innerHTML = '<h3 style="margin:10px 0;font-size:16px;">🗳️ 후보자 공약 확인</h3>';
    const list = [ {key:'A',name:'김후보',party:'가나당'}, {key:'B',name:'이후보',party:'다라당'}, {key:'C',name:'박후보',party:'마바당'} ];
    list.forEach(c=>{
      const btn = document.createElement('button');
      btn.innerText = `${c.key}. ${c.name} (${c.party})`;
      Object.assign(btn.style,{display:'block',width:'100%',margin:'8px 0',padding:'12px',background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'8px',cursor:'pointer',fontSize:'14px',pointerEvents:'auto'});
      btn.onclick=()=>this._showCandidateInfo(c);
      sec.appendChild(btn);
    });
    this.phoneScreen.appendChild(sec);
  }

  _createPublicOpinionSection() {
    const sec = document.createElement('div');
    sec.innerHTML = '<h3 style="margin:15px 0 10px 0;font-size:16px;">💬 여론 확인</h3>';
    const news = document.createElement('div');
    Object.assign(news.style,{background:'rgba(255,255,255,0.1)',padding:'10px',borderRadius:'8px',marginBottom:'10px',fontSize:'12px',lineHeight:'1.4'});
    news.innerHTML=`<div style="font-weight:bold;margin-bottom:5px;">📰 "선거 D-7, 후보들 마지막 공약 발표"</div><div style="color:#ccc;">경쟁...</div>`;
    sec.appendChild(news);
    const cmsec=document.createElement('div');cmsec.innerHTML='<div style="font-size:12px;margin:10px 0 5px 0;">댓글 반응:</div>';
    const rdiv=document.createElement('div');Object.assign(rdiv.style,{display:'flex',gap:'10px'});
    ['👍 공감 (1234)','👎 비추 (567)'].forEach(t=>{const b=document.createElement('button');b.innerText=t;Object.assign(b.style,{flex:1,padding:'8px',background:'rgba(255,255,255,0.2)',color:'white',border:'1px solid rgba(255,255,255,0.3)',borderRadius:'5px',cursor:'pointer',fontSize:'11px',pointerEvents:'auto'});rdiv.appendChild(b);});
    cmsec.appendChild(rdiv);sec.appendChild(cmsec);
    this.phoneScreen.appendChild(sec);
  }

  _showCandidateInfo(candidate) {
    const popup=document.createElement('div');Object.assign(popup.style,{position:'absolute',top:'20px',left:'20px',right:'20px',background:'rgba(0,0,0,0.9)',color:'white',padding:'15px',borderRadius:'10px',fontSize:'12px',zIndex:1001});
    const policies={A:['교육비 지원 확대','청년 일자리 창출','환경 보호'],B:['의료비 절감','교통 인프라 확충','중소기업 지원'],C:['복지 제도 개선','문화 예술 진흥','디지털 혁신']};
    popup.innerHTML=`<div style="font-weight:bold;margin-bottom:10px;">${candidate.name} 주요 공약</div>${policies[candidate.key].map(p=>`<div>• ${p}</div>`).join('')}<button id="close-popup" style="margin-top:10px;padding:5px 10px;background:#666;color:#fff;border:none;borderRadius:3px;cursor:pointer;">닫기</button>`;
    this.phoneScreen.appendChild(popup);
    popup.querySelector('#close-popup').onclick=()=>popup.remove();
    setTimeout(()=>popup.remove(),3000);
  }

  _showPreVoteChoice() {
    this.phoneScreen.innerHTML='';
    const q=document.createElement('div');q.innerText='사전투표날 투표하실 건가요?';Object.assign(q.style,{textAlign:'center',fontSize:'18px',margin:'40px 0',fontWeight:'bold'});
    this.phoneScreen.appendChild(q);
    const cont=document.createElement('div');Object.assign(cont.style,{display:'flex',justifyContent:'space-around',marginTop:'30px'});
    ['네','아니요'].forEach(lbl=>{const b=document.createElement('button');b.innerText=lbl;Object.assign(b.style,{padding:'10px 20px',fontSize:'16px',background:'#fff',color:'#333',border:'none',borderRadius:'5px',cursor:'pointer'});b.onclick=()=>{this.deactivate();this.sceneManager.transitionTo('voteChoice');};cont.appendChild(b);});
    this.phoneScreen.appendChild(cont);
  }

  _startTimer() {
    this.timerInterval=setInterval(()=>{this.timer--;this.timerDisplay.innerText=`남은 시간: ${this.timer}초`;if(this.timer<=0)this._endScene();},1000);
  }

  _endScene() {
    clearInterval(this.timerInterval);
    if(this.isActive){this.deactivate();this.sceneManager.transitionTo('voteChoice');}
  }

  activate() {
    this.isActive=true;
    this.timer=20;
    this._createPhoneUI();
    this._startTimer();
    this.camera.position.set(0,0,3);
    this.camera.lookAt(0,0,0);
    let rot=0;const anim=()=>{if(!this.isActive)return;rot+=0.01;this.phone.rotation.z=Math.sin(rot)*0.1;requestAnimationFrame(anim);};anim();
  }

  deactivate() {
    this.isActive=false;
    clearInterval(this.timerInterval);
    this.phoneUIContainer?.remove();
  }

  update() {
    if(this.isActive){const l=this.scene.children.find(c=>c.isPointLight);if(l)l.intensity=1+Math.sin(Date.now()*0.002)*0.2;}
  }

  resize() {
    this.camera.aspect=window.innerWidth/window.innerHeight;this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.deactivate();this.scene.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)Array.isArray(c.material)?c.material.forEach(m=>m.dispose()):c.material.dispose();});
  }
}
