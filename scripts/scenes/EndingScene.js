const THREE = window.THREE;

function createTextMesh(text, font, size = 1.0, height = 0.05, color = 0xffff00) {
  const geometry = new THREE.TextGeometry(text, {
    font: font,
    size: size,
    height: height,
    curveSegments: 12,
  });
  const material = new THREE.MeshBasicMaterial({ color });
  return new THREE.Mesh(geometry, material);
}

class EndingScene {
  constructor(renderer, camera, sceneManager) {
    this.renderer = renderer;
    this.camera = camera;
    this.sceneManager = sceneManager;
    this.scene = new THREE.Scene();
    this.introGroup = null;
    this.titleGroup = null;
    this.outroGroup = null;
    this.startTime = null;
    this.fontLoaded = false;
  }

  onEnter() {
    const loader = new THREE.FontLoader();
    loader.load('/scripts/fonts/Star Jedi Hollow_Regular.json', (titleFont) => {
      loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (bodyFont) => {
        const intro = 'In South Korea, a vote was cast —\nand destiny was rewritten across the stars.';
        const title = 'V0TE\nWARS';
        const outro = `THE PEOPLE HAVE SPOKEN!
Through a single act of democratic will, a once-divided nation has united 
— LEFT and RIGHT now walk hand in hand.
The winds of history have shifted: the NORTH and SOUTH have reconciled, 
bringing long-lost brothers together under one flag.

As harmony spreads across the continent, ASIA rises as one, 
an unbreakable bond forged through a common dream.
Soon, the WORLD follows, no longer fragmented by borders, 
but linked through shared purpose and peace.

From the ashes of conflict emerges an era of universal unity 
— not merely among humankind, but across the stars.
In a stunning twist of fate, the voice of Earth reaches distant galaxies… 
and they answered —
NOT WITH WAR, BUT WITH FRIENDSHIP.

Aliens now walk beside us, not as conquerors, but as comrades.
And all of this… began with your vote.`;

        // Intro group
        const introGroup = new THREE.Group();
        let yOffsetIntro = 0;
        intro.split('\n').forEach((line) => {
          const mesh = createTextMesh(line, bodyFont, 1.0);
          mesh.geometry.computeBoundingBox();
          const textWidth = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
          mesh.position.set(-textWidth / 2, yOffsetIntro, 0);
          introGroup.add(mesh);
          yOffsetIntro -= 1.2;
        });
        introGroup.position.set(0, 0, -10);
        this.introGroup = introGroup;
        this.scene.add(this.introGroup);

        // Title group
        const titleGroup = new THREE.Group();
        let yOffsetTitle = 0;
        title.split('\n').forEach((line) => {
          const mesh = createTextMesh(line, titleFont, 16.0);
          mesh.geometry.computeBoundingBox();
          const textWidth = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x;
          mesh.position.set(-textWidth / 2, yOffsetTitle, 0);
          titleGroup.add(mesh);
          yOffsetTitle -= 24.0;
        });
        titleGroup.position.set(0, -12 + 10, -10);
        titleGroup.scale.set(24, 24, 24);
        this.titleGroup = titleGroup;

        // Outro group
        const outroGroup = new THREE.Group();
        let yOffsetOutro = 0;
        outro.split('\n').forEach((line) => {
          const mesh = createTextMesh(line, bodyFont, 0.8);
          mesh.geometry.computeBoundingBox();
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

    this.camera.position.set(0, -2, 10);
    this.camera.lookAt(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
  }

  update() {
    if (!this.fontLoaded) return;

    const elapsed = (Date.now() - this.startTime) / 1000;

    if (elapsed < 1) {
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
    } else if (elapsed >= 1 && elapsed < 10) {
      // Remove introGroup after 1s
      if (this.introGroup && this.scene.children.includes(this.introGroup)) {
        this.scene.remove(this.introGroup);
      }
      // Add titleGroup if not added
      if (this.titleGroup && !this.scene.children.includes(this.titleGroup)) {
        this.scene.add(this.titleGroup);
      }
      // Animate titleGroup to move up and scale down and fade out
      const t = (elapsed - 1) / 9; // 0 to 1 over 9 seconds
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
    } else if (elapsed >= 8) {
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

    if (elapsed > 20) {
      this.sceneManager.transitionTo('menu');
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.EndingScene = EndingScene;