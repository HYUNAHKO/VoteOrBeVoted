# The Vote War

> 대한민국 대선 테마의 WebGL/Three.js 기반 게임 프로젝트
> * 이 프로젝트는 연세대학교 컴퓨터과학과 CAS3205 Computer Graphics 수업의 일환으로 제작되었습니다.

---

## 프로젝트 개요

`The Vote War`은 플레이어가 “유권자(Voter)” 가 되어 대선 투표에 참여하는 `선거 시뮬레이션 게임` 입니다. 플레이어는 게임을 통해 집에서 후보자의 공약 정보를 살펴보고, 개표방송을 보기까지 알아야만 하는 선거 관련 정보를 배워볼 수 있습니다. 갖가지 미처 알지 못했던 불법 행위와 실수가 일어날 수 있는 게임 내 여러 이벤트에서 올바른 선택지를 골라 무사히 투표를 하러 다녀오고, 열성적인 응원으로 개표방송을 완주해 응원하는 후보의 당선을 지켜보아야 무사히 게임을 통과할 수 있습니다. 중간에 하나라도 실수가 있다면, 플레이어는 아쉽게도 집으로 돌아가 다시 투표를 하러 가야합니다.

---

## Team Members

* 김이지 (컴퓨터과학) yiji_kim@yonsei.ac.kr
* 고현아 (건설환경공학, 컴퓨터과학) kha9867@yonsei.ac.kr
* 안진형 (철학, 컴퓨터과학) ajhh98@yonsei.ac.kr

## 🎮 Main Scenes

### 1. **인트로 씬 (SceneIntro)**
   - **목적**: 게임 세계관 소개 및 플레이어 몰입감 유도
   - **구성**: 대한민국 투표 역사를 담은 시네마틱 영상 재생
   - **상호작용**: 영상 시청 후 "시작하기" 버튼으로 게임 본편 진입
   - **전환**: 집 씬(SceneHome)으로 자동 이동

### 2. **집 씬 (SceneHome)**
   - **목적**: 선거 정보 습득 및 투표 방식 선택
   - **환경**: 플레이어의 집 내부 - 침실, 책상, TV 등 3D 모델링
   - **주요 활동**:
     - 📊 후보자별 공약 정보 탐색 및 비교 분석
     - 💬 선거 관련 뉴스 기사 댓글 작성 체험
     - 🗳️ 사전투표 vs 본투표 선택지 제공
   - **교육적 요소**: 올바른 정보 습득과 합리적 선택의 중요성 학습
   - **전환**: 선택에 따라 사전투표소 또는 본투표소로 이동

### 3. **투표소 씬 (SceneMainVote / SceneEarlyVote)**
   - **목적**: 실제 투표 과정의 체험적 학습
   - **환경**: 현실적인 투표소 내부 - 접수대, 기표소, 투표함 등
   - **투표 프로세스**:
     1. 👥 선거안내원과의 신분 확인 상호작용
     2. 📋 투표용지 수령 및 확인
     3. 🏛️ 기표소 입장 후 비밀 투표 진행
     4. 📦 투표함 투입으로 투표 완료
   - **이벤트 시스템**:
     - ⚠️ 투표용지 촬영 금지 이벤트 (선거법 위반 방지)
     - 📱 휴대폰 사용 제한 및 올바른 투표 절차 안내
   - **전환**: 투표 완료 후 집으로 복귀 씬으로 이동

### 4. **집으로 복귀 씬 (SceneReturnHome)**
   - **목적**: 투표 후 시민 의식 및 선거법 준수 교육
   - **환경**: 집으로 향하는 야외 경로 - 거리, 선거 벽보, 시설물 등
   - **핵심 이벤트**:
     - 🤐 투표 비밀 보장: 친구/지인에게 투표 후보 공개 여부 선택
     - 🖍️ 선거 벽보 관리: 낙서/훼손 방지 및 시민 의식 실천
     - ⚖️ 선거법 위반 상황 대처 방법 학습
   - **분기점**: 올바른 선택 시 개표방송 관람, 실수 시 게임 재시작
   - **전환**: 성공적 귀가 후 개표방송 씬으로 이동

### 5. **개표방송 씬 (ResultBroadcastScene)**
   - **목적**: 민주주의 참여 완성 및 선거 결과에 대한 책임감 체험
   - **환경**: 집 내부 - TV 앞 소파에서 개표방송 시청
   - **게임플레이**:
     - 📺 실시간 개표 현황 확인 (3명 후보 중 선택한 후보 강조)
     - ⌨️ 스페이스바 연타를 통한 응원 시스템
     - 🏆 응원 정도에 따른 당선 결과 변화
   - **교육적 의미**: 투표 참여의 중요성과 결과에 대한 시민의 역할 인식
   - **전환**: 개표 결과 확정 후 엔딩 씬으로 이동

### 6. **엔딩 씬 (EndingScene)**
   - **목적**: 게임 완주 축하 및 선거 참여 효능감 증진
   - **연출**: 스타워즈 오프닝 크레딧 오마주 - 우주 배경의 스크롤링 텍스트
   - **메시지**: 
     - 🌟 민주주의 참여의 가치와 의미
     - 🗳️ 한 표의 소중함과 시민으로서의 자긍심
     - 🚀 미래 선거 참여에 대한 동기 부여
   - **완주 보상**: 게임 전체 경험을 통한 선거 과정 완전 이해
---

## 🛠️ 기술 스택

### **Core Technologies**
- **WebGL/3D Graphics**: Three.js (r158+), Blender - 3D 렌더링 및 씬 관리
- **Frontend**: Vanilla JavaScript (ES6+ Modules) - 순수 JS로 구현된 가벼운 구조

### **3D Assets & Media**
- **3D Models**: GLTF/GLB, FBX 포맷 - Blender 제작 커스텀 모델
- **Textures**: HDR, PNG, JPG - 현실적인 PBR 텍스처링
- **Video**: Veo3 - AI활용 인트로 영상

### **Development Tools**
- **Version Control**: Git - 협업 및 버전 관리
- **Code Structure**: ES6 모듈 시스템 - 씬 기반 아키텍처
- **Asset Pipeline**: Custom Utils - 최적화된 리소스 로딩

### **Performance Features**
- **Loading Optimization**: 프로그레시브 로딩 및 텍스처 압축
- **Memory Management**: 씬 전환 시 자동 메모리 정리
- **Cross-Platform**: 데스크톱/모바일 웹 브라우저 호환

---

## 📁 디렉터리 구조

```plaintext
/VoteOrBeVoted
│
├─ index.html                     ← 메인 HTML 파일
│
├─ styles/
│   └─ styles.css                 ← 전역 UI 스타일시트
│
├─ scripts/
│   ├─ main.js                    ← Three.js 렌더러 및 초기화
│   ├─ SceneManager.js            ← 씬 전환 관리자
│   │
│   ├─ scenes/                    ← 게임 씬 모음
│   │   ├─ BaseScene.js           ← 씬 기본 클래스
│   │   ├─ SceneIntro.js          ← 인트로 영상 씬
│   │   ├─ SceneHome.js           ← 집 내부 씬
│   │   ├─ SceneMainVote.js       ← 본투표 투표소 씬
│   │   ├─ SceneEarlyVote.js      ← 사전투표 투표소 씬
│   │   ├─ SceneReturnHome.js     ← 귀가 경로 씬
│   │   ├─ ResultBroadcastScene.js ← 개표방송 씬
│   │   └─ EndingScene.js         ← 엔딩 크레딧 씬
│   │
│   ├─ utils/                     ← 유틸리티 모듈
│   │   ├─ util.js                ← 공통 유틸 함수
│   │   ├─ processImport.js       ← 3D 모델 로딩 헬퍼
│   │   ├─ collisionControl.js    ← 충돌 감지 시스템
│   │   ├─ visualize.js           ← 디버깅 시각화 도구
│   │   ├─ GameState.js           ← 게임 상태 관리
│   │   ├─ Candidate.js           ← 후보자 데이터 모델
│   │   ├─ ProgressResultRenderer.js ← 진행률 렌더러
│   │   └─ bar.js                 ← UI 바 컴포넌트
│   │
│   └─ fonts/                     ← 텍스트 렌더링용 폰트
│
├─ assets/
│   ├─ models/                    ← 3D 모델 파일
│   ├─ characters/                ← 캐릭터 애니메이션 모델
│   ├─ textures/                  ← 텍스처 및 이미지
│   └─ videos/                    ← 영상 파일
├─ libs/                          ← 외부 라이브러리
│   ├─ three.min.js               ← Three.js WebGL 엔진
│   └─ gsap.min.js                ← GSAP 애니메이션 라이브러리
└─ references/                    ← 참조 자료
```

---

## 🗂️ 핵심 아키텍처 설명

### **🎯 씬 기반 아키텍처**
- **SceneManager.js**: 각 게임 씬을 등록하고 부드러운 전환을 관리하는 핵심 매니저
- **BaseScene.js**: 모든 씬이 상속받는 기본 클래스로, 공통 라이프사이클 메서드 제공
- **개별 씬들**: 각각 독립적인 3D 환경과 게임플레이 로직을 캡슐화

### **🎮 게임 상태 관리**
- **GameState.js**: 전역 게임 상태 (선택한 후보, 플레이어 선택지 등) 관리
- **Candidate.js**: 3명의 대선 후보 데이터 모델 및 정보 관리
- **ProgressResultRenderer.js**: 개표 진행률 및 실시간 결과 렌더링

### **🛠️ 유틸리티 시스템**
- **processImport.js**: GLTF/FBX 모델의 비동기 로딩 및 최적화 처리
- **collisionControl.js**: 3D 공간에서의 마우스/터치 상호작용 및 충돌 감지
- **util.js**: 공통 헬퍼 함수들 (수학 연산, 애니메이션, DOM 조작 등)
- **visualize.js**: 개발용 디버깅 도구 및 3D 씬 시각화 헬퍼

### **🎨 에셋 파이프라인**
- **3D Models**: Blender에서 제작된 최적화된 GLTF/FBX 모델들
- **Character Animations**: 캐릭터별 승리/실패/상호작용 애니메이션
- **HDR Environment**: 현실적인 조명을 위한 360도 환경맵


