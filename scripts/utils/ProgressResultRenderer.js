// src/utils/ProgressResultRenderer.js
import * as THREE from 'three';

export default class ProgressResultRenderer {
  /**
   * @param {THREE.Renderer} renderer — 메인 WebGL 렌더러
   * @param {Number} width — RT 너비 (예: 512)
   * @param {Number} height — RT 높이 (예: 256)
   */
  constructor(renderer, width = 512, height = 256) {
    this.renderer = renderer;
    this.width  = width;
    this.height = height;

    // 1) 내부 장면과 카메라
    this.rtScene  = new THREE.Scene();
    this.rtCamera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      -1000, 1000
    );

    // 2) 렌더 타겟
    this.rt = new THREE.WebGLRenderTarget(width, height);
    this.rt.texture.minFilter = THREE.LinearFilter;
    this.rt.texture.magFilter = THREE.LinearFilter;
    // Enable RGBA for transparency
    this.rt.texture.format = THREE.RGBAFormat;
    this.rt.texture.type = THREE.UnsignedByteType;


    // 4) 프로그레스 바 (2개)
    const barHeight = 20;
    this.barHeight = barHeight;
    const barWidth  = width - 40;
    this.barWidth = barWidth;
    // this.tapBarBg = this._makeBarMesh(barWidth, barHeight, 0x444444);
    // this.progBarBg = this._makeBarMesh(barWidth, barHeight, 0x444444);
    this.tapBarFg = this._makeBarMesh(barWidth, barHeight, 0xffa500);
    this.progBarFg= this._makeBarMesh(barWidth, barHeight, 0x00ff00);
    // Start bars at zero width
    this.tapBarFg.scale.set(0, 1, 1);
    this.progBarFg.scale.set(0, 1, 1);

    // 배치
    // this.tapBarBg.position.set(0, 50, 0);
    this.tapBarFg.position.copy(new THREE.Vector3(0, 50, 0)).add(new THREE.Vector3(-barWidth/2, 0, 1));
    // this.progBarBg.position.set(0, -50, 0);
    this.progBarFg.position.copy(new THREE.Vector3(0, -50, 0)).add(new THREE.Vector3(-barWidth/2, 0, 1));

    [this.tapBarFg, this.progBarFg]
      .forEach(m => this.rtScene.add(m));

    // 5) 결과 텍스트용 스프라이트 (비동기 생성)
    this.resultSprite = null;
  }

  _makeBarMesh(width, height, color) {
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({ color });
    return new THREE.Mesh(geo, mat);
  }

  /**
   * 프로그레스 업데이트
   * @param {Number} tapRatio — [0,1]
   * @param {Number} timeRatio— [0,1]
   */
  updateProgress(tapRatio, timeRatio) {
    console.log(`🔧 updateProgress called — tapRatio: ${tapRatio}, timeRatio: ${timeRatio}`);
    // foreground bar 너비 갱신
    this.tapBarFg.scale.x = tapRatio;
    this.tapBarFg.position.x = - this.barWidth/2 + (this.barWidth * tapRatio)/2;
    this.progBarFg.scale.x = timeRatio;
    this.progBarFg.position.x = - this.barWidth/2 + (this.barWidth * timeRatio)/2;
  }

  /**
   * 결과 텍스트 표시
   * @param {Boolean} isSuccess 
   */
  showResult(isSuccess) {
    // 1) 프로그레스 바 숨기기
    this.rtScene.remove(this.tapBarFg, this.progBarFg);

    // 2) 캔버스에 텍스트 그리기
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height= this.height;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font      = 'bold 24px sans-serif';
    ctx.fillStyle = isSuccess ? 'lime' : 'crimson';
    ctx.textAlign = 'center';
    ctx.fillText(
      isSuccess ? '🎉 당신의 후보가 당선되었습니다!' : '💀 낙선하셨습니다. 5년 뒤를 기약하세요.',
      canvas.width/2, canvas.height/2 + 10
    );

    // 3) 스프라이트 생성해 장면에 추가
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(this.width, this.height, 1);
    this.resultSprite = sprite;
    this.rtScene.add(sprite);
  }

  /** 렌더 타겟을 갱신하고, 메인 씬에 뿌릴 머티리얼을 반환 */
  renderToTexture() {
    console.log('🔧 renderToTexture called — clearing and rendering rtScene');
    // Ensure transparent clear
    const prevClearColor = new THREE.Color();
    const prevClearAlpha = this.renderer.getClearAlpha();
    this.renderer.getClearColor(prevClearColor);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setRenderTarget(this.rt);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.rtScene, this.rtCamera);
    this.renderer.setRenderTarget(null);
    // Restore clear color/alpha
    this.renderer.setClearColor(prevClearColor, prevClearAlpha);
    return this.rt.texture;
  }

  /**
   * Attach the progress bars to a given container (e.g., overlay mesh)
   * @param {THREE.Object3D} container — the parent to attach bar meshes to
   */
  attachTo(container) {
    console.log('🔧 ProgressResultRenderer.attachTo called, container:', container);
    // Remove any existing bars from previous container
    [this.tapBarFg, this.progBarFg].forEach(bar => {
      if (bar.parent) bar.parent.remove(bar);
    });

    // Position bars relative to container local space
    const yOffset = this.height / 2 + this.barHeight + 10;
    this.tapBarFg.position.set(-this.barWidth / 2, yOffset, 0.02);
    this.progBarFg.position.set(-this.barWidth / 2, yOffset + (this.barHeight * 1.5), 0.02);

    // Reset scales so foreground bars start at zero width
    this.tapBarFg.scale.set(0, 1, 1);
    this.progBarFg.scale.set(0, 1, 1);

    // Add bars to container
    container.add(this.tapBarFg, this.progBarFg);

    // Instruction text sprite above bars
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = this.width;
    labelCanvas.height = 50;
    const labelCtx = labelCanvas.getContext('2d');
    // transparent background
    labelCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
    // text style
    labelCtx.font = 'bold 18px sans-serif';
    labelCtx.fillStyle = '#000000';
    labelCtx.textAlign = 'center';
    labelCtx.fillText(
      'Space Bar를 연타해서 당신의 후보를 당선시키세요!',
      labelCanvas.width / 2,
      30
    );
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true
    });
    const labelSprite = new THREE.Sprite(labelMaterial);
    // scale sprite to match overlay width and text height
    labelSprite.scale.set(this.width, 50, 1);
    // position above the two bars
    const yLabel = (this.barHeight * 1.5) + (this.barHeight * 1.5) + 20;
    labelSprite.position.set(0, yLabel, 0.02);
    container.add(labelSprite);
  }
}