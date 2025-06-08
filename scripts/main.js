/**
 * main.js
 * - Three.js 초기화, SceneManager 생성 및 씬 등록, 렌더 루프를 시작
 */
import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import SceneIntro from './scenes/SceneIntro.js';
import SceneManager from './SceneManager.js';
import SceneMenu from './scenes/SceneMenu.js';
import SceneVotingBooth from './scenes/SceneVotingBooth.js';
import SceneTVCount from './scenes/SceneTVCount.js';
import SceneCandidateCamp from './scenes/SceneCandidateCamp.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1) 렌더러 생성
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // 2) 카메라 생성
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // 3) SceneManager 생성
  const sceneManager = new SceneManager(renderer, camera);
  
  // 🎯 전역 변수로 노출 (디버깅용)
  window.sceneManager = sceneManager;
  window.THREE = THREE; // THREE.js도 전역에 노출

  // 4) 씬 인스턴스 생성 및 등록
  const introScene = new SceneIntro(renderer, camera, sceneManager);
  const menuScene = new SceneMenu(renderer, camera, sceneManager);
  const votingBoothScene = new SceneVotingBooth(renderer, camera, sceneManager);
  const tvCountScene = new SceneTVCount(renderer, camera, sceneManager);
  const candidateCampScene = new SceneCandidateCamp(renderer, camera, sceneManager);

  sceneManager.addScene('intro', introScene);
  sceneManager.addScene('menu', menuScene);
  sceneManager.addScene('votingBooth', votingBoothScene);
  sceneManager.addScene('tvCount', tvCountScene);
  sceneManager.addScene('candidateCamp', candidateCampScene);

  // 5) 렌더링 루프 먼저 시작
  sceneManager.renderLoop();

  // 6) 최초 씬 설정: 인트로 화면
  sceneManager.transitionTo('intro');

  // 7) 창 크기 변화 처리
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log('SceneManager initialized:', sceneManager);
});