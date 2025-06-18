# The Vote War

> 대한민국 대선 테마의 WebGL/Three.js 기반 게임 프로젝트
> * 이 프로젝트는 연세대학교 컴퓨터과학과 CAS3205 Computer Graphics 수업의 일환으로 제작되었습니다.

---

## 프로젝트 개요

`The Vote War`은 플레이어가 “유권자(Voter)” 가 되어 대선 투표에 참여하는 `선거 시뮬레이션 게임` 입니다. 플레이어는 실수와 불법행위를 유발하는 이벤트들을 피해 무사히 투표를 마치고 집에 도착해야 합니다. 그리고 개표방송을 보면서 응원하는 후보의 당선을 끌어내야만 게임을 Three.js를 사용해
가상의 투표소, 개표 화면, 후보 캠프 등을 구현하며, SceneManager를 통해 화면 전환을 처리합니다.

---

## 주요 기능

1. **인트로 (SceneIntro)**
   - 짧은 투표 역사 영상을 보여준 후 "시작하기" 버튼을 제공합니다.
   - 버튼 클릭 시 투표소 씬으로 바로 이동합니다.

2. **메뉴 화면 (SceneMenu)**
   - “유권자” 또는 “후보”를 선택할 수 있는 메뉴 UI 제공
   - 버튼 클릭 시 다음 씬(SceneVotingBooth 또는 SceneCandidateCamp)으로 전환

3. **투표소 씬 (SceneVotingBooth)**
   - 투표소 내부를 3D 모델(의자, 책상, 투표함 등)로 구성
   - 간단한 투표 애니메이션 또는 인터랙션(예: 투표 용지 선택, 제출 등) 예시 포함

4. **개표 씬 (SceneTVCount)**
   - TV 화면(Plane + 영상 텍스처) 또는 실시간 결과 수치 배치
   - 투표소 씬에서 버튼 클릭 후 해당 씬으로 전환되며, 개표 과정을 시뮬레이션

5. **후보 캠프 씬 (SceneCandidateCamp)**
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
│       ├─ SceneIntro.js          ← 인트로 슬라이드 씬
│       ├─ voter/                 ← 유권자 경로 관련 씬 모음
│       │   ├─ SceneVoterRally.js
│       │   ├─ SceneVoterPolicySearch.js
│       │   └─ ...
│       ├─ candidate/             ← 후보 경로 관련 씬 모음
│       │   ├─ SceneCandidateRegister.js
│       │   └─ ...
│       ├─ SceneVotingBooth.js    ← 기본 투표소 씬 예시
│       ├─ SceneTVCount.js        ← TV 보면서 개표 씬

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
```

---

## 🗂️ 파일 및 디렉터리 설명


### index.html
- 최상위 HTML 파일입니다.
- Three.js, SceneManager, main.js를 로드합니다.
- `<canvas>` 요소 및 Overlay UI용 `<div>`를 포함합니다.
- 게임 스크립트는 ES 모듈 형식으로 `main.js`에서 불러옵니다.

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

### scripts/scenes/SceneIntro.js
- 간단한 투표 역사 슬라이드를 보여주는 인트로 씬입니다.
- 슬라이드가 끝나면 "시작하기" 버튼으로 투표소 씬으로 이동합니다.
---

### scripts/scenes/SceneVotingBooth.js
- 투표소 씬을 위한 로직이 담긴 모듈입니다.
- 내부 3D 오브젝트 배치 및 간단한 투표 인터랙션을 포함합니다.

---

### scripts/scenes/SceneTVCount.js
- 투표소 씬 다음 단계인 개표 화면을 구현합니다.
- Plane + 동영상 텍스처 또는 실시간 결과 UI가 포함됩니다.

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


