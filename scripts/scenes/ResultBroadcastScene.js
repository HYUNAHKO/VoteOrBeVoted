import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


export default class ResultBroadcastScene {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.keyPressCount = 0;
    this.timeLimit = 5000; // 5초
    this.requiredCount = 30; // 당선을 위한 최소 입력
    this.hasHandledResult = false;
    this.clock = new THREE.Clock();
    this._initScene();
    this._createUI();
  }

  onEnter() {
    this.keyPressCount = 0;
    this.startTime = performance.now();
    this.hasHandledResult = false;
    document.getElementById('result-ui').style.display = 'block';

    window.addEventListener('keydown', this._onKeyDown);
  }

  onExit() {
    const ui = document.getElementById('result-ui');
    if (ui) {
      ui.remove(); // 완전히 DOM에서 제거
    }
    window.removeEventListener('keydown', this._onKeyDown);

    // Remove all objects from the scene to clean up visuals
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  update() {
    const delta = this.clock ? this.clock.getDelta() : 0;
    if (this.mixer) this.mixer.update(delta);
    if (this.candidateMixers) {
      this.candidateMixers.forEach(m => m.update(delta));
    }

    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.timeLimit);

    this.progressBar.style.width = `${progress * 100}%`;

    const keyProgress = Math.min(1, this.keyPressCount / this.requiredCount);
    this.tapProgressBar.style.width = `${keyProgress * 100}%`;

    if (elapsed >= this.timeLimit && !this.hasHandledResult) {
      this.hasHandledResult = true;
      if (this.keyPressCount >= this.requiredCount) {
        this.sceneManager.transitionTo('victory');
      } else {
        this.sceneManager.transitionTo('fiveYearsLater');
      }
    }
  }

  render() {
    this.renderer.setClearColor(0x000000);
  }

  _initScene() {
    const light = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(light);
    // 추가적으로 후보 얼굴, 카운트 효과 등 모델 넣을 수 있음

    // Load and display a character model
    const loader = new GLTFLoader();
    loader.load('assets/models/three_candidates.glb', (gltf) => {
      this.characterModel = gltf.scene;
      const children = this.characterModel.children;
      this.candidateMixers = [];
      this.candidateActions = [];

      children.forEach((child, i) => {
        const mixer = new THREE.AnimationMixer(child);
        this.candidateMixers.push(mixer);

        if (gltf.animations && gltf.animations.length > 0) {
          const animIndex = i % gltf.animations.length;
          const action = mixer.clipAction(gltf.animations[animIndex]);
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
          this.candidateActions.push(action);
        }
      });

      this.characterModel.position.set(0, 0, 0);
      this.scene.add(this.characterModel);
      // if (gltf.animations && gltf.animations.length > 0) {
      //   this.mixer = new THREE.AnimationMixer(this.characterModel);
      //   this.actions = gltf.animations.map((clip) => this.mixer.clipAction(clip));
      //   this.actions[0].play(); // 기본 애니메이션 시작
      // }
    }, undefined, (error) => {
      console.error('Failed to load model:', error);
    });
  }

  _createUI() {
    const div = document.createElement('div');
    div.id = 'result-ui';
    div.style.position = 'absolute';
    div.style.top = '65%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.backgroundColor = 'rgba(0,0,0,0.8)';
    div.style.color = 'white';
    div.style.padding = '20px';
    div.style.fontSize = '20px';
    div.style.textAlign = 'center';
    div.style.display = 'none';
    div.innerHTML = `
      <p>🔥 개표 중... 당신의 후보가 당선되려면 <strong>Spacebar</strong>를 연타하세요!</p>
      <div style="width: 100%; height: 20px; background: gray; margin-bottom: 8px;">
        <div id="tap-progress-bar" style="height: 100%; background: orange; width: 0%;"></div>
      </div>
      <div style="width: 100%; height: 20px; background: gray;">
        <div id="progress-bar" style="height: 100%; background: lime; width: 0%;"></div>
      </div>
    `;
    document.body.appendChild(div);
    this.progressBar = document.getElementById('progress-bar');
    this.tapProgressBar = document.getElementById('tap-progress-bar');

    this._onKeyDown = (e) => {
      if ([' ', 'Enter'].includes(e.key)) {
        this.keyPressCount++;
        if (this.candidateActions) {
          this.candidateActions.forEach(action => {
            action.reset().play();
          });
        }
      }
    };
  }
}
