const THREE = window.THREE;

// 주어진 텍스트와 폰트를 이용해 텍스트 메시 객체를 생성하는 함수
function createTextMesh(text, font, size = 1.0, height = 0.05, color = 0xffff00) {
  const geometry = new THREE.TextGeometry(text, {
    font: font,
    size: size,
    height: height,
    curveSegments: 12,
  });
  const material = new THREE.MeshBasicMaterial({ color });
  return geometry ? new THREE.Mesh(geometry, material) : new THREE.Group();
}

// 엔딩 씬을 담당하는 클래스
class EndingScene {
  constructor(renderer, camera, sceneManager) {
    // 렌더러
    this.renderer = renderer;
    // 카메라
    this.camera = camera;
    // 씬 매니저
    this.sceneManager = sceneManager;
    // 현재 씬
    this.scene = new THREE.Scene();
    // 인트로 텍스트 그룹
    this.introGroup = null;
    // 타이틀 텍스트 그룹
    this.titleGroup = null;
    // 아웃트로 텍스트 그룹
    this.outroGroup = null;
    // 시작 시간
    this.startTime = null;
    // 폰트 로딩 완료 여부
    this.fontLoaded = false;
    this.restartButtonShown = false;
  }

  // 씬 진입 시 호출되는 함수
  // 폰트 로딩 및 텍스트 메시 구성
  onEnter() {
    this.scene.background = new THREE.Color(0x000000); // 블랙 배경 설정

    const fontLoader = new THREE.FontLoader();

    fontLoader.load('/scripts/fonts/Star Jedi Hollow_Regular.json', (titleFont) => {
      fontLoader.load('/scripts/fonts/HSJiptokki Black_Regular.json', (bodyFont) => {
        if (!titleFont || !bodyFont) {
          console.error("폰트 로딩 실패");
          return;
        }

        const intro = '대한민국에서 한 표가 던져졌고,\n 그 순간 운명은 우주 너머까지 새롭게 쓰이기 시작했다.';
        const title = 'V0TE\nWARS';
        const outro = '국민이 말했다\n한 번의 민주적 선택으로, 분열되었던 국가는 하나가 되었다.\n좌와 우는 이제 손을 맞잡고 함께 걷는다.\n\n역사의 바람이 바뀌었다\n 남과 북이 화해하고, 오랜 시간 떨어져 있던 형제들이 하나의 깃발 아래 다시 만났다.\n조화는 대륙을 넘어 퍼지고,\n아시아는 하나의 꿈으로 단결된 공동체로 거듭난다.\n머지않아 전 세계가 그 흐름을 따른다.\n더 이상 경계로 나뉘지 않고,\n공통된 목적과 평화를 통해 연결된다.\n\n갈등의 잿더미 속에서 인류 보편의 통일 시대가 시작된다. \n 그것은 인류를 넘어 우주로까지 확장된다.\n놀라운 운명의 반전 속에서, 지구의 목소리는 머나먼 은하계까지 닿고...\n그들은 응답했다 \n전쟁이 아닌, 우정으로.\n\n이제 외계인들은 정복자가 아닌 동료로서 우리 곁에 있다.\n그리고 이 모든 일은...\n당신의 한 표로부터 시작되었다.';

        const introGroup = new THREE.Group();
        let yOffsetIntro = 0;
        intro.split('\n').forEach((line) => {
          const mesh = createTextMesh(line, bodyFont, 1.0);
          mesh.geometry.computeBoundingBox?.();
          const textWidth = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
          mesh.position.set(-textWidth / 2, yOffsetIntro, 0);
          introGroup.add(mesh);
          yOffsetIntro -= 1.5;
        });
        introGroup.position.set(0, 0, -10);
        this.introGroup = introGroup;
        this.scene.add(this.introGroup);

        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/assets/ending_background2.png', (texture) => {
          const backgroundMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
          });

          const backgroundGeometry = new THREE.PlaneGeometry(40, 40);
          const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
          backgroundMesh.position.set(0, -5, -15);
          this.scene.add(backgroundMesh);
        });

        const titleGroup = new THREE.Group();
        let yOffsetTitle = 0;
        title.split('\n').forEach((line) => {
          const mesh = createTextMesh(line, titleFont, 16.0);
          mesh.geometry.computeBoundingBox?.();
          const textWidth = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
          mesh.position.set(-textWidth / 2, yOffsetTitle, 0);
          titleGroup.add(mesh);
          yOffsetTitle -= 24.0;
        });
        titleGroup.position.set(0, -12 + 10, -10);
        titleGroup.scale.set(24, 24, 24);
        this.titleGroup = titleGroup;

        const outroGroup = new THREE.Group();
        let yOffsetOutro = 0;
        outro.split('\n').forEach((line) => {
          const mesh = createTextMesh(line, bodyFont, 0.8);
          mesh.geometry.computeBoundingBox?.();
          const textWidth = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
          mesh.position.set(-textWidth / 2, yOffsetOutro, 0);
          outroGroup.add(mesh);
          yOffsetOutro -= 2;
        });
        outroGroup.position.set(0, -12, -10);
        outroGroup.rotation.x = -0.6;
        this.outroGroup = outroGroup;

        this.startTime = Date.now();
        this.fontLoaded = true;
      });
    });

    // 카메라 초기 위치 및 방향 설정
    this.camera.position.set(0, -2, 10);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
  }

  // 씬 프레임마다 호출되어 애니메이션 처리
  update() {
    if (!this.fontLoaded) return;

    const elapsed = (Date.now() - this.startTime) / 1000;

    // 1초 미만: 인트로 텍스트만 표시
    if (elapsed < 1.5) {
      // Show only introGroup
      if (this.introGroup && !this.scene.children.includes(this.introGroup)) {
        this.scene.add(this.introGroup);
      }
      if (this.titleGroup && this.scene.children.includes(this.titleGroup)) {
        this.scene.remove(this.titleGroup);
      }
      if (this.outroGroup && this.scene.children.includes(this.outroGroup)) {
        this.scene.remove(this.outroGroup);
      }
    // 1~4초: 타이틀 텍스트 애니메이션 (위로 이동 + 축소 + 페이드아웃)
    } else if (elapsed >= 1.5 && elapsed < 4) {
      // Remove introGroup after 1s
      if (this.introGroup && this.scene.children.includes(this.introGroup)) {
        this.scene.remove(this.introGroup);
      }
      // Add titleGroup if not added
      if (this.titleGroup && !this.scene.children.includes(this.titleGroup)) {
        this.scene.add(this.titleGroup);
      }
      // Animate titleGroup to move up and scale down and fade out over 2.5 seconds
      const t = Math.min(1, (elapsed - 1.5) / 2.5);
      // Move up by 10 units total
      this.titleGroup.position.y = (-12 + 10) + 10 * t;
      // Scale down from 3 to 0.1
      const scale = 3 * (1 - t) + 0.1 * t;
      this.titleGroup.scale.set(scale, scale, scale);
      // Fade out by adjusting material opacity
      this.titleGroup.children.forEach(mesh => {
        if (!mesh.material.transparent) {
          mesh.material.transparent = true;
        }
        mesh.material.opacity = 1 - t * 0.6;
      });
      // Remove outroGroup if present
      if (this.outroGroup && this.scene.children.includes(this.outroGroup)) {
        this.scene.remove(this.outroGroup);
      }
    // 4초 이후: 아웃트로 텍스트 표시 및 이동 애니메이션
    } else if (elapsed >= 4) {
      // Remove introGroup and titleGroup if present
      if (this.introGroup && this.scene.children.includes(this.introGroup)) {
        this.scene.remove(this.introGroup);
      }
      if (this.titleGroup && this.scene.children.includes(this.titleGroup)) {
        this.scene.remove(this.titleGroup);
      }
      // Add outroGroup if not added
      if (this.outroGroup && !this.scene.children.includes(this.outroGroup)) {
        this.scene.add(this.outroGroup);
      }
      // Scroll outroGroup steadily away from camera (in Z) and up (in Y)
      this.outroGroup.position.z -= 0.01;
      this.outroGroup.position.y += 0.03;
      this.outroGroup.rotation.x = -0.6;
    }

    // 8초 이후: 메뉴 화면으로 전환
    if (elapsed > 8) {
      if (!this.restartButtonShown) {
        this._showRestartButton();
        this.restartButtonShown = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  _showRestartButton() {
    const button = document.createElement("button");
    button.innerText = "게임 다시하기";
    button.style.position = "absolute";
    button.style.top = "80%";
    button.style.left = "50%";
    button.style.transform = "translate(-50%, -50%)";
    button.style.padding = "12px 24px";
    button.style.fontSize = "18px";
    button.style.backgroundColor = "#ffcc00";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";
    button.style.zIndex = "999";

    button.addEventListener("click", () => {
      button.remove(); // 버튼 제거
      this.sceneManager.transitionTo("menu");
    });

    document.body.appendChild(button);
  }
}

window.EndingScene = EndingScene;