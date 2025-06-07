# 3D 모델 뷰어 `visualize.js`
![screenshot](./assets/visualize_screenshot.png)

## 기능

- 3D 모델 로딩 및 표시 (GLB, FBX 형식 지원)
- 마우스로 모델 회전, 확대/축소, 이동 가능
- 오브젝트에 마우스를 올리면 오브젝트 이름 표시. -> interection 구현시 이름 확인 후 사용
- console 창에서 모든 object hierarchy 확인 가능!! 묶여있는 인터렉션 비활성화 object 빼고 인터렉션 가능 객체 확인

## 사용 방법

1. `visualize.js` 파일에서 `MODEL_PATH` 변수를 수정하여 원하는 3D 모델 파일 경로를 지정
   ```javascript
   const MODEL_PATH = '../assets/your-model.glb'; // 또는 .fbx 파일
   ```

## 컨트롤

- **마우스 왼쪽 버튼 드래그**: 모델 회전
- **마우스 오른쪽 버튼 드래그**: 모델 이동
- **마우스 휠**: 확대/축소
- **마우스 오버**: 오브젝트 이름 표시
