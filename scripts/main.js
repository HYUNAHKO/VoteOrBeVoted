/**
 * main.js
 * - Three.js 초기화, SceneManager 생성 및 씬 등록, 렌더 루프를 시작
 */
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

  // 4) 씬 인스턴스 생성 및 등록
  const menuScene = new SceneMenu(renderer, camera, sceneManager);
  const votingBoothScene = new SceneVotingBooth(renderer, camera, sceneManager);
  const tvCountScene = new SceneTVCount(renderer, camera, sceneManager);
  const candidateCampScene = new SceneCandidateCamp(renderer, camera, sceneManager);
  // voter path scenes
  const voterRally = new SceneVoterRally(renderer, camera, sceneManager);
  const voterPolicy = new SceneVoterPolicySearch(renderer, camera, sceneManager);
  const voterStreet = new SceneVoterStreet(renderer, camera, sceneManager);
  const voterFind = new SceneVoterFindPolling(renderer, camera, sceneManager);
  const voterChoice = new SceneVoterVoteChoice(renderer, camera, sceneManager);
  const voterPolling = new SceneVoterPollingBooth(renderer, camera, sceneManager);
  // candidate path scenes
  const candRegister = new SceneCandidateRegister(renderer, camera, sceneManager);
  const candBudget = new SceneCandidateBudget(renderer, camera, sceneManager);
  const candSites = new SceneCandidateSelectSites(renderer, camera, sceneManager);
  const candCampaign = new SceneCandidateCampaign(renderer, camera, sceneManager);
  const candForecast = new SceneCandidateForecast(renderer, camera, sceneManager);
  const candExit = new SceneCandidateExitPoll(renderer, camera, sceneManager);
  const candInaug = new SceneCandidateInauguration(renderer, camera, sceneManager);

  sceneManager.addScene('menu', menuScene);
  sceneManager.addScene('votingBooth', votingBoothScene);
  sceneManager.addScene('tvCount', tvCountScene);
  sceneManager.addScene('candidateCamp', candidateCampScene);
  sceneManager.addScene('voterRally', voterRally);
  sceneManager.addScene('voterPolicy', voterPolicy);
  sceneManager.addScene('voterStreet', voterStreet);
  sceneManager.addScene('voterFind', voterFind);
  sceneManager.addScene('voterChoice', voterChoice);
  sceneManager.addScene('voterPolling', voterPolling);
  sceneManager.addScene('candRegister', candRegister);
  sceneManager.addScene('candBudget', candBudget);
  sceneManager.addScene('candSites', candSites);
  sceneManager.addScene('candCampaign', candCampaign);
  sceneManager.addScene('candForecast', candForecast);
  sceneManager.addScene('candExit', candExit);
  sceneManager.addScene('candInaug', candInaug);

  // 5) 최초 씬 설정: 메뉴 화면
  sceneManager.transitionTo('menu');

  // 6) 렌더링 루프 호출
  sceneManager.renderLoop();

  // 7) 창 크기 변화 처리
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
});
