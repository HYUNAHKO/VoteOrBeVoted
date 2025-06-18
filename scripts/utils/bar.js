import ProgressResultRenderer from './ProgressResultRenderer.js';
import * as THREE from 'three';

export default class BarUtil {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {number} width
   * @param {number} height
   */
  constructor(renderer, width = 512, height = 256) {
    this.prRenderer = new ProgressResultRenderer(renderer, width, height);
    this.screenMesh = null;
  }

  /**
   * Initialize bar overlay on the given TV screen mesh.
   * Replaces its material with the renderer’s texture.
   * @param {THREE.Mesh} screenMesh
   */
  init(screenMesh) {
    this.screenMesh = screenMesh;
    screenMesh.material = new THREE.MeshBasicMaterial({
      map: this.prRenderer.renderToTexture(),
      side: THREE.DoubleSide,
      transparent: true
    });
  }

  /**
   * Update bar progress and refresh TV screen texture.
   * @param {number} tapRatio 0 to 1
   * @param {number} timeRatio 0 to 1
   */
  update(tapRatio, timeRatio) {
    if (!this.screenMesh) return;
    this.prRenderer.updateProgress(tapRatio, timeRatio);
    this.screenMesh.material.map = this.prRenderer.renderToTexture();
    this.screenMesh.material.needsUpdate = true;
  }

  /**
   * Show final result frame (true=success, false=failure)
   * @param {boolean} success
   */
  showResult(success) {
    this.prRenderer.showResult(success);
    if (this.screenMesh) {
      this.screenMesh.material.map = this.prRenderer.renderToTexture();
      this.screenMesh.material.needsUpdate = true;
    }
  }
}
