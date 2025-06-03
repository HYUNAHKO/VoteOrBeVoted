# VoteOrBeVoted

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



index.html
* 최상위 HTML. Three.js, SceneManager, main.js 등을 로드합니다.
* 두 개의 주요 <div>(canvas용, Overlay UI용)를 갖습니다.

styles/styles.css
* 모든 화면에 공통으로 쓰일 CSS. Overlay UI(메뉴, 버튼, 전환 오버레이 등)의 스타일이 들어갑니다.
* scripts/SceneManager.js

각 Scene을 등록하고 전환하는 간단한 매니저.
* addScene(name, instance) → transitionTo(name)으로 장면 전환.

scripts/main.js
* 초기화 진입점. Three.js 렌더러, 카메라, 기본 조명 세팅 후 SceneManager를 생성합니다.
* 첫 화면으로 SceneMenu를 띄웁니다.

scripts/scenes/SceneMenu.js
* 유권자/후보를 선택할 수 있는 첫 번째 메뉴 화면을 구현합니다.
* 버튼 클릭 시 SceneManager를 통해 다음 씬(예: SceneVotingBooth 또는 SceneCandidateCamp)으로 전환합니다.

scripts/scenes/SceneVotingBooth.js
* 투표소 씬 코드를 모듈화해서 담아둡니다.

scripts/scenes/SceneTVCount.js
* 유권자 경로에서, 투표소 씬→TV 개표 씬으로 넘어갈 때 사용합니다.
* TV 장치(Plane + 영상 텍스처 또는 결과 수치)를 배치하는 예시를 보여줍니다.

scripts/scenes/SceneCandidateCamp.js
* “후보” 경로에서 플레이어가 캠페인장을 돌아다니거나 토론 씬으로 넘어가는 로직을 구현할 때 사용합니다.
(지금은 간단히 자리만 표시)

assets/ 아래에는 필요한 3D 모델(GLTF), 텍스처 이미지, 개표 영상(mp4) 등을 위치시킵니다.

