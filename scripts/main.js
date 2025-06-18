/**
 * main.js
 * - Three.js 초기화, SceneManager 생성 및 씬 등록, 렌더 루프를 시작
 */
import * as THREE from 'three';
import SceneIntro from './scenes/SceneIntro.js';
import SceneManager from './SceneManager.js';
import SceneVotingBooth from './scenes/SceneVotingBooth.js';
import SceneVoteChoice from './scenes/SceneVoteChoice.js';
import SceneHome from './scenes/SceneHome.js';
import SceneReturnHome from './scenes/SceneReturnHome.js';
import EndingScene from './scenes/EndingScene.js';
import ResultBroadcastScene from './scenes/ResultBroadcastScene.js';
import SceneEarlyVote from './scenes/SceneEarlyVote.js';
import SceneMainVote from './scenes/SceneMainVote.js';

window.addEventListener('DOMContentLoaded', () => {
  THREE.ColorManagement.enabled = true;
  // 1) 렌더러 생성 - 크기 설정 확실히
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Three.js r160 렌더러 설정 추가
  renderer.outputColorSpace = THREE.SRGBColorSpace; 
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.useLegacyLights = true;
  
  // 캔버스를 컨테이너에 추가
  const container = document.getElementById('canvas-container');
  container.appendChild(renderer.domElement);

  // 2) 카메라 생성
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // 카메라 초기 위치 확실히 설정
  camera.position.set(0, 2, 5);
  camera.rotation.set(0, 0, 0);
  camera.updateProjectionMatrix();

  // 3) SceneManager 생성
  const sceneManager = new SceneManager(renderer, camera);
  
  // 전역 변수로 노출 (디버깅용)
  window.sceneManager = sceneManager;
  window.THREE = THREE; // THREE.js도 전역에 노출
  window.renderer = renderer; // 렌더러도 전역에 노출

  // 4) 씬 인스턴스 생성 및 등록
  sceneManager.addScene('intro', () => new SceneIntro(renderer, camera, sceneManager));
  sceneManager.addScene('votingBooth', () => new SceneVotingBooth(renderer, camera, sceneManager));
  sceneManager.addScene('voteChoice', () => new SceneVoteChoice(renderer, camera, sceneManager));
  sceneManager.addScene('home', () => new SceneHome(renderer, camera, sceneManager));
  sceneManager.addScene('returnHome', () => new SceneReturnHome(renderer, camera, sceneManager));
  sceneManager.addScene('ending', () => new EndingScene(renderer, camera, sceneManager));
  sceneManager.addScene('resultBroadcast', () => new ResultBroadcastScene(renderer, camera, sceneManager));
  sceneManager.addScene('earlyVote', () => new SceneEarlyVote(renderer, camera, sceneManager));
  sceneManager.addScene('mainVote', () => new SceneMainVote(renderer, camera, sceneManager));

  // 5) 렌더링 루프 먼저 시작
  sceneManager.renderLoop();

  // 6) 최초 씬 설정
  sceneManager.transitionTo('resultBroadcast');

  // 7) 창 크기 변화 처리
  window.addEventListener('resize', () => {
    console.log('🔄 윈도우 리사이즈:', window.innerWidth, 'x', window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  console.log('SceneManager initialized:', sceneManager);
});