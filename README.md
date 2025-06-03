# VoteOrBeVoted

> 대한민국 대선 테마의 WebGL/Three.js 기반 간단 게임 예시 프로젝트

---

## 프로젝트 개요

`VoteOrBeVoted`는 사용자가 “유권자(Voter)” 또는 “후보(Candidate)” 역할을 선택하여
각기 다른 씬(Scene)을 체험해보는 미니 게임 예시입니다. Three.js를 사용해
가상의 투표소, 개표 화면, 후보 캠프 등을 구현하며, SceneManager를 통해 화면 전환을 처리합니다.

---

## 주요 기능

1. **첫 화면 (SceneMenu)**
   - “유권자” 또는 “후보”를 선택할 수 있는 메뉴 UI 제공
   - 버튼 클릭 시 다음 씬(SceneVotingBooth 또는 SceneCandidateCamp)으로 전환

2. **투표소 씬 (SceneVotingBooth)**
   - 투표소 내부를 3D 모델(의자, 책상, 투표함 등)로 구성
   - 간단한 투표 애니메이션 또는 인터랙션(예: 투표 용지 선택, 제출 등) 예시 포함

3. **개표 씬 (SceneTVCount)**
   - TV 화면(Plane + 영상 텍스처) 또는 실시간 결과 수치 배치
   - 투표소 씬에서 버튼 클릭 후 해당 씬으로 전환되며, 개표 과정을 시뮬레이션

4. **후보 캠프 씬 (SceneCandidateCamp)**
   - 후보 진영(캠프) 내부를 3D 환경으로 구성
   - 향후 토론 또는 캠페인 로직 확장을 위한 자리만 표시하는 기본 구조 제공

---

## 📁 디렉터리 구조

```plaintext
/project-root
│
├─ index.html
├─ styles/
│   └─ styles.css
│
├─ scripts/
│   ├─ main.js
│   ├─ SceneManager.js
│   │
│   └─ scenes/
│       ├─ SceneMenu.js           ← 첫 화면 (유권자 or 후보 선택)
│       ├─ SceneVotingBooth.js    ← 투표소 씬
│       ├─ SceneTVCount.js        ← TV 보면서 개표 씬
│       └─ SceneCandidateCamp.js  ← 후보 씬 (추후 구현)
│
├─ assets/
│   ├─ models/      ← GLTF/OBJ 등 3D 모델
│   ├─ textures/    ← 이미지, 텍스처
│   ├─ videos/      ← 개표 화면용 영상 파일(mp4 등)
│   └─ fonts/       ← 필요 시 커스텀 폰트
│
└─ libs/
    ├─ three.min.js
    └─ gsap.min.js   ← optional, 카메라/오브젝트 애니메이션용

---

## 🗂️ 파일 및 디렉터리 설명


### index.html
- 최상위 HTML 파일입니다.
- Three.js, SceneManager, main.js를 로드합니다.
- `<canvas>` 요소 및 Overlay UI용 `<div>`를 포함합니다.

---

### styles/styles.css
- 전역 공통 CSS 파일입니다.
- Overlay UI (메뉴 버튼, 전환 오버레이 등)의 스타일을 정의합니다.

---

### scripts/SceneManager.js
- 각 씬(Scene)을 등록하고 전환(transition)하는 매니저입니다.
- 주요 메서드:
  - `addScene(name, instance)` : 씬 등록
  - `transitionTo(name)` : 특정 씬으로 전환

---

### scripts/main.js
- Three.js 렌더러, 카메라, 기본 조명 세팅을 처리합니다.
- SceneManager를 생성하고 초기 씬을 로드합니다.

---

### scripts/scenes/SceneMenu.js
- 유권자/후보 선택 메뉴 UI를 구현한 씬입니다.
- 버튼 클릭 시 `SceneManager`를 통해 다음 씬으로 전환합니다.

---

### scripts/scenes/SceneVotingBooth.js
- 투표소 씬을 위한 로직이 담긴 모듈입니다.
- 내부 3D 오브젝트 배치 및 간단한 투표 인터랙션을 포함합니다.

---

### scripts/scenes/SceneTVCount.js
- 투표소 씬 다음 단계인 개표 화면을 구현합니다.
- Plane + 동영상 텍스처 또는 실시간 결과 UI가 포함됩니다.

---

### scripts/scenes/SceneCandidateCamp.js
- 후보 캠프 씬을 위한 기본 모듈입니다.
- 3D 공간에 캠프 구조를 배치하며, 향후 토론/캠페인 기능 확장을 고려한 구조입니다.

---

### assets/

- `models/` : GLTF, OBJ 등 3D 모델 파일  
- `textures/` : 이미지, 텍스처 파일  
- `videos/` : 투표 결과 영상(mp4 등)  
- `fonts/` : 필요 시 커스텀 폰트 파일

---

### libs/

- `three.min.js` : Three.js 라이브러리  
- `gsap.min.js` : GSAP 애니메이션 라이브러리 *(선택적으로 사용됨)*


