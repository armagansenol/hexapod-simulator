import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { config } from "./configuration.ts";
import { HexapodController } from "./hexapod/controller.ts";
import { numberToHexString } from "./utils.js";
import "../styles/scss/reset.scss";
import "../styles/scss/style.scss";

/**
 * The main application class that is the entry point.
 */
class App {
  private scene: THREE.Scene;
  private floorPlane: THREE.Mesh;
  private camera: THREE.PerspectiveCamera;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private hexapod: HexapodController;

  constructor() {
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.floorPlane = this.createFloorPlane(this.scene);
    this.ambientLight = this.createAmbientLight(this.scene);
    this.directionalLight = this.createDirectionalLight(this.scene);
    this.renderer = this.createRenderer();
    this.controls = this.createOrbitControls(this.camera, this.renderer);

    this.init(this.scene, this.renderer);
  }

  /**
   * Initializes the 3D scene along with the hexapod and the hexapod controller.
   *
   * @param {THREE.Scene} scene - The Three.js scene to add the hexapod to
   * @param {THREE.WebGLRenderer} renderer - The renderer instance for animation
   * @returns {void}
   */
  init(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
    window.addEventListener("resize", this.updateAspectRatio.bind(this));
    document.body.prepend(renderer.domElement);

    const hexapod = new HexapodController(scene);
    this.hexapod = hexapod;

    // this.composer = new EffectComposer(renderer);
    // this.composer.addPass(new RenderPass(scene, this.camera));
    // this.composer.addPass(
    //   new EffectPass(
    //     this.camera,
    //     new DepthOfFieldEffect(this.camera,{
    //       focusDistance: 0.05,
    //       // focalLength: 2,
    //       bokehScale: 10.0,
    //       height: 726,
    //     })
    //   )
    // );

    renderer.setAnimationLoop(this.animate.bind(this));

    this.updateAspectRatio();
  }

  /**
   * Upates the renderer size, and the camera aspect.
   */
  updateAspectRatio() {
    let controlPanel = document.querySelector(
      "main.control-panel"
    ) as HTMLElement;
    let width = window.innerWidth;
    let height = window.innerHeight - controlPanel.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.controls.update();
  }

  animate() {
    // window.requestAnimationFrame(this.animate.bind(this))
    this.controls.update();
    this.hexapod.animate();
    this.renderer.render(this.scene, this.camera);
    // this.composer.render();
  }

  /**
   * Creates the scene and set's the background color
   *
   * @returns {THREE.Scene} - The scene
   */
  createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.colorBackground);
    document.body.style.backgroundColor = `#${numberToHexString(
      config.colorBackground
    )}`;

    let geometry, material, mesh;

    // const swing = 0.735  
    // geometry = new MeshLineGeometry();
    // geometry.setPoints([
    //   new THREE.Vector3(0.85, 0.735+swing/2, 0),
    //   new THREE.Vector3(0.85, 0.735, 0),
    // ]);
    // material = new MeshLineMaterial({
    //   color: new THREE.Color("#ff0000"),
    //   lineWidth: 0.1,
    //   resolution: new THREE.Vector2(1024, 1024)
    // });
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    // geometry = new MeshLineGeometry();
    // geometry.setPoints([
    //   new THREE.Vector3(0.85, 0.735, 0),
    //   new THREE.Vector3(0.85, 0.735-swing/2, 0),
    // ]);
    // material = new MeshLineMaterial({
    //   color: new THREE.Color("#0000ff"),
    //   lineWidth: 0.1,
    //   resolution: new THREE.Vector2(1024, 1024)
    // });
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    // geometry = new MeshLineGeometry();
    // geometry.setPoints([
    //   new THREE.Vector3(0.85, swing/2, 0),
    //   new THREE.Vector3(0.85, 0, 0),
    // ]);
    // material = new MeshLineMaterial({
    //   color: new THREE.Color("#ff0000"),
    //   lineWidth: 0.1,
    //   resolution: new THREE.Vector2(1024, 1024)
    // });
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    // geometry = new MeshLineGeometry();
    // geometry.setPoints([
    //   new THREE.Vector3(0.85, 0, 0),
    //   new THREE.Vector3(0.85, -swing/2, 0),
    // ]);
    // material = new MeshLineMaterial({
    //   color: new THREE.Color("#0000ff"),
    //   lineWidth: 0.1,
    //   resolution: new THREE.Vector2(1024, 1024)
    // });
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    // geometry = new MeshLineGeometry();
    // geometry.setPoints([
    //   new THREE.Vector3(0.85, -0.735+swing/2, 0),
    //   new THREE.Vector3(0.85, -0.735, 0),
    // ]);
    // material = new MeshLineMaterial({
    //   color: new THREE.Color("#ff0000"),
    //   lineWidth: 0.1,
    //   resolution: new THREE.Vector2(1024, 1024)
    // });
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    // geometry = new MeshLineGeometry();
    // geometry.setPoints([
    //   new THREE.Vector3(0.85, -0.735-swing/2, 0),
    //   new THREE.Vector3(0.85, -0.735, 0),
    // ]);
    // material = new MeshLineMaterial({
    //   color: new THREE.Color("#0000ff"),
    //   lineWidth: 0.1,
    //   resolution: new THREE.Vector2(1024, 1024)
    // });
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);
    return scene;
  }

  /**
   * Creates the perpective camera, and orients it
   *
   * @returns {THREE.PerspectiveCamera} - The camera
   */
  createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      config.camera.fov,
      config.camera.aspect,
      config.camera.near,
      config.camera.far
    );

    camera.up.set(0, 0, 1);
    camera.position.set(...config.camera.position);
    camera.lookAt(this.scene.position);

    return camera;
  }

  /**
   * Creates the floor plane
   *
   * @param {THREE.Scene} scene - The scene
   * @returns {THREE.Mesh} - The floor plane
   */
  createFloorPlane(scene: THREE.Scene): THREE.Mesh {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(...config.sizeFloorPlane),
      new THREE.MeshPhysicalMaterial({
        color: config.colorFloorPlane,
        side: THREE.DoubleSide,
      })
    );
    plane.receiveShadow = true;

    scene.add(plane);

    return plane;
  }

  /**
   * Creates the ambient light
   *
   * @param {THREE.Scene} scene - The scene
   * @returns {THREE.AmbientLight} - The ambient light
   */
  createAmbientLight(scene: THREE.Scene): THREE.AmbientLight {
    const light = new THREE.AmbientLight(
      config.lights.ambient.color,
      config.lights.ambient.intensity
    );

    // if (conf.lights.ambient.shadow.cast) {
    //   light.castShadow = conf.lights.ambient.shadow.cast;
    // }

    scene.add(light);

    return light;
  }

  /**
   * Creates the directional light
   *
   * @param {THREE.Scene} scene - The scene
   * @returns {THREE.DirectionalLight} - The directional light
   */
  createDirectionalLight(scene: THREE.Scene): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(
      config.lights.directional.color,
      config.lights.directional.intensity
    );

    light.position.set(...config.lights.directional.position);

    if (config.lights.directional.shadow.cast) {
      light.castShadow = config.lights.directional.shadow.cast;
      light.shadow.mapSize.width =
        config.lights.directional.shadow.mapSizeWidth;
      light.shadow.mapSize.height =
        config.lights.directional.shadow.mapSizeHeight;
      light.shadow.camera.near = config.lights.directional.shadow.cameraNear;
      light.shadow.camera.far = config.lights.directional.shadow.cameraFar;
    }

    scene.add(light);

    return light;
  }

  /**
   * Creates the renderer for the scene
   *
   * @returns {THREE.WebGLRenderer} - The WebGL renderer
   */
  createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      // antialias: false,
      // stencil: false,
      // depth: false,
    });

    renderer.setPixelRatio(window.devicePixelRatio);

    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height);

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    return renderer;
  }

  /**
   * Creates the orbit controls used to move the camera around the scene
   *
   * @param {THREE.Camera} camera - The scene camera
   * @param {THREE.WebGLRenderer} renderer - The scene
   * renderer
   * @returns {OrbitControls} - The orbit controls
   */
  createOrbitControls(
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ): OrbitControls {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.autoRotate = config.orbitControls.autoRotate;
    controls.enableDamping = config.orbitControls.enableDamping;
    controls.dampingFactor = config.orbitControls.dampingFactor;
    return controls;
  }
}

window.addEventListener("load", (e) => {
  const app = new App();
});
