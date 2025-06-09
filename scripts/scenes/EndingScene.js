const THREE = window.THREE;
class EndingScene {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scrollText = null;
    this.startTime = null;
    this.scene = new THREE.Scene();
  }

  onEnter() {
    const loader = new THREE.FontLoader();
    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
      const textGeometry = new THREE.TextGeometry(
        '당신의 한 표 덕에 대한민국은\n좌우 통일, 남북 통일,\n아시아 통합, 세계 통일,\n우주 통일하여 세계를 정복하였습니다!',
        {
          font: font,
          size: 0.5,
          height: 0.05,
          curveSegments: 12,
        }
      );

      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      this.scrollText = new THREE.Mesh(textGeometry, textMaterial);
      this.scrollText.position.set(-5, -5, -10);
      this.scene.add(this.scrollText);
      this.startTime = Date.now();
    });

    this.camera.position.set(0, 0, 5);
  }

  update() {
    if (this.scrollText) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.scrollText.position.y += 0.01;
      this.scrollText.rotation.x = -0.3;

      // Automatically return to menu or reset after 20 seconds
      if (elapsed > 20) {
        this.sceneManager.transitionTo('menu');
      }
    }
  }
}
window.EndingScene = EndingScene;