import * as THREE from "three";
import { Timer } from "three/examples/jsm/Addons.js";

import { config } from "../configuration.ts";
import {
  deg2rad,
  rad2deg,
  sampleCircle,
  sq,
  sqrt,
  V3,
  createCylinderAligned,
  createLine,
  // cubicBezier,
  easeInOutCubic,
} from "../utils";
import { Leg } from "./leg";
import { Events, JointAngles, Pose, Animation } from "./common";
import { Model } from "./model.ts";
import { Animator } from "./animation.ts";

function makeLerpEndpointFunc(initial: THREE.Vector3, final: THREE.Vector3) {
  const current = new THREE.Vector3();

  return function (t: number): THREE.Vector3 {
    current.lerpVectors(initial, final, t);
    return current;
  };
}

function makeLerpPoseFunc(initial: Pose, final: Pose) {
  const position = new THREE.Vector3();
  const rotation = new THREE.Vector3();

  const initialPosition = new THREE.Vector3(initial.x, initial.y, initial.z);
  const initialRotation = new THREE.Vector3(
    initial.roll,
    initial.pitch,
    initial.yaw
  );

  const finalPosition = new THREE.Vector3(final.x, final.y, final.z);
  const finalRotation = new THREE.Vector3(final.roll, final.pitch, final.yaw);

  return function (t: number): Pose {
    position.lerpVectors(initialPosition, finalPosition, t);
    rotation.lerpVectors(initialRotation, finalRotation, t);

    return {
      x: position.x,
      y: position.y,
      z: position.z,
      roll: rotation.x,
      pitch: rotation.y,
      yaw: rotation.z,
    };
  };
}

export class Hexapod extends EventTarget {
  public scene: THREE.Scene;

  public legs: Array<Leg>;
  public mesh: THREE.Mesh;
  private timer: Timer;

  private animationID: number;
  private animationQueue: Array<Animation>;
  private currentAnimation: null | Animation;
  private isAnimationPaused: boolean;
  private lerpEndpoints: Array<(t: number) => THREE.Vector3>;
  private lerpPose: (t: number) => Pose;
  private t: number;
  public animationDirection: "forward" | "backward";
  private lastEndpoints;
  private model: Model;
  private animator: Animator;

  /**
   * Creates an instance of a hexapod
   * @param {THREE.Scene} scene - The Three.js scene where the hexapod exists
   */
  constructor(scene: THREE.Scene) {
    super();

    this.scene = scene;
    this.timer = new Timer();

    const coxaPoints = this.calculateCoxaPoints();

    this.mesh = this.createMesh(coxaPoints);
    scene.add(this.mesh);

    this.legs = this.createLegs(coxaPoints);

    // For animating
    this.animationID = 0;
    this.animationQueue = [];
    this.currentAnimation = null;
    this.isAnimationPaused = false;
    this.animationDirection = "forward";
    // this.lerpEndpoints = null;
    // this.lerpPose = null;
    this.t = 0;

    this.lastEndpoints = null;
  }

  setAnimator(animator) {
    this.animator = animator;
  }

  /**
   * Computes the initial coxa joint positions
   *
   * @returns {Array.Vector3} - The sampled, and scaled
   * coxa points.
   */
  calculateCoxaPoints(): Array<THREE.Vector3> {
    const points = sampleCircle({
      radius: config.hexapod.body.radius,
      interval: 60,
      offset: 0,
      z: config.hexapod.body.height,
    });

    const matrix = new THREE.Matrix4();

    matrix.makeScale(
      config.hexapod.coxa.scale.x,
      config.hexapod.coxa.scale.y,
      config.hexapod.coxa.scale.z
    );

    const scaledPoints = points.map((pt) => pt.applyMatrix4(matrix));

    return scaledPoints;
  }

  /**
   * Creates the mesh representing the main "torso" of the
   * hexapod
   *
   * @param {Array<THREE.Vector3} points - The coxa joint
   * positions
   * @returns {THREE.Mesh} - The body mesh
   */
  createMesh(points: Array<THREE.Vector3>): THREE.Mesh {
    const vertices = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = point.z;
    });

    const skeletonGeometry = new THREE.BufferGeometry();

    const buffer = new THREE.BufferAttribute(vertices, 3);

    skeletonGeometry.setAttribute("position", buffer);

    const skeletonMaterial = new THREE.MeshBasicMaterial({
      opacity: 0,
      transparent: true,
    });

    const skeleton = new THREE.Mesh(skeletonGeometry, skeletonMaterial);

    skeleton.scale.x = config.hexapod.body.scale.x;
    skeleton.scale.y = config.hexapod.body.scale.y;
    skeleton.scale.z = config.hexapod.body.scale.z;

    // Skin is the visibile part of the body

    const skinGeometry = new THREE.CapsuleGeometry(
      config.hexapod.body.radius,
      0.01,
      8,
      6
    );

    const skinMaterial = new THREE.MeshPhysicalMaterial({
      iridescence: 1,
      color: config.hexapod.colorBody,
    });

    const skin = new THREE.Mesh(skinGeometry, skinMaterial);
    skin.rotation.x = Math.PI / 2;
    skin.rotation.y = Math.PI / 2;

    skin.castShadow = config.shadows;
    skin.receiveShadow = config.shadows;

    skeleton.add(skin);

    return skeleton;
  }

  /**
   * Creates the hexapod's legs based on coxa points
   * @param {Array<THREE.Vector3>} coxaPoints - The coxa joint positions
   * @returns {Array<Leg>} - The array of leg objects
   */
  createLegs(coxaPoints: Array<THREE.Vector3>): Array<Leg> {
    const legs = [] as Array<Leg>;
    let legIndexes = [0, 1, 2, 3, 4, 5];
    legIndexes.forEach((legIndex) => {
      const leg = new Leg(legIndex, coxaPoints[legIndex], this.scene);

      // leg.addEventListener(Events.HexapodJointAnglesUpdate, (e) => {
      //   this.dispatchEvent(
      //     new CustomEvent(Events.HexapodJointAnglesUpdate, {
      //       detail: (<CustomEvent>e).detail,
      //     })
      //   );
      // });

      // leg.addEventListener(Events.HexapodEndpointPositionsUpdate, (e) => {
      //   this.dispatchEvent(
      //     new CustomEvent(Events.HexapodEndpointPositionsUpdate, {
      //       detail: (<CustomEvent>e).detail,
      //     })
      //   );
      // });

      legs.push(leg);
    });
    return legs;
  }

  /**
   * Sets the model representation for the hexapod
   * @param {Model} model - The model to be set
   */
  setModel(model: Model) {
    this.model = model;

    // this.model.addEventListener(Events.SliderValuesChanged,this.handleSliderValuesChanged.bind(this))
  }

  /** Pauses the current animation */
  pauseAnimation() {
    this.isAnimationPaused = true;
  }

  /** Resumes the current animation */
  resumeAnimation() {
    this.isAnimationPaused = false;
  }

  /**
   * Adds an animation to the queue
   * @param {Animation} animation - The animation to be queued
   */
  queueAnimation(animation: Animation) {
    this.animationID = this.animationID + 1;

    this.animationQueue.push({
      id: this.animationID,
      timescale: animation.timescale || 1,
      poseInitial: animation.poseInitial,
      poseFinal: animation.poseFinal,
      endpointsInitial: animation.endpointsInitial,
      endpointsFinal: animation.endpointsFinal,
    });
    console.log("Animation queued: ", this.animationQueue);
  }

  /**
   * Starts a given animation
   * @param {Animation} animation - The animation to be started
   */
  startAnimation(animation: Animation) {
    this.currentAnimation = animation;
    const pose = this.model.pose;
    const initialPose = animation.poseInitial || pose;

    initialPose.x = initialPose.x ?? pose.x;
    initialPose.y = initialPose.y ?? pose.y;
    initialPose.z = initialPose.z ?? pose.z;
    initialPose.roll = initialPose.roll ?? pose.roll;
    initialPose.pitch = initialPose.pitch ?? pose.pitch;
    initialPose.yaw = initialPose.yaw ?? pose.yaw;

    const finalPose = animation.poseFinal || this.model.pose;

    finalPose.x = finalPose.x ?? pose.x;
    finalPose.y = finalPose.y ?? pose.y;
    finalPose.z = finalPose.z ?? pose.z;
    finalPose.roll = finalPose.roll ?? pose.roll;
    finalPose.pitch = finalPose.pitch ?? pose.pitch;
    finalPose.yaw = finalPose.yaw ?? pose.yaw;

    const endpointsInitial = animation.endpointsInitial || this.model.endpoints;
    const endpointsFinal = animation.endpointsFinal || this.model.endpoints;

    this.lerpPose = makeLerpPoseFunc(<Pose>initialPose, <Pose>finalPose);

    this.lerpEndpoints = [];
    for (let i = 0; i < 6; i++) {
      this.lerpEndpoints.push(
        makeLerpEndpointFunc(endpointsInitial[i], endpointsFinal[i])
      );
    }

    this.t = 0;

    this.dispatchEvent(
      new CustomEvent(Events.HexapodAnimationStarted, {
        detail: {
          animation: this.currentAnimation,
        },
      })
    );
  }

  /**
   * Handles the animation step logic
   */
  animate() {
    if (this.isAnimationPaused) return;

    // if (this.animator) this.animator.step();

    this.timer.update();

    if (!this.currentAnimation && this.animationQueue.length === 0) {
      return;
    }

    if (!this.currentAnimation) {
      let animation;
      if (this.animationDirection === "forward") {
        animation = this.animationQueue.shift() as Animation;
      } else {
        animation = this.animationQueue.pop() as Animation;
      }
      this.startAnimation(animation);
      return;
    }

    const timescale = <number>this.currentAnimation.timescale;

    const delta = this.timer.getDelta();

    if (this.t >= 1) {
      this.dispatchEvent(
        new CustomEvent(Events.HexapodAnimationFinished, {
          detail: {
            animation: this.currentAnimation,
            endpoints: this.lastEndpoints,
          },
        })
      );

      if (this.animationQueue.length > 0) {
        let animation;
        if (this.animationDirection === "forward") {
          animation = this.animationQueue.shift() as Animation;
        } else {
          animation = this.animationQueue.pop() as Animation;
        }
        this.startAnimation(animation);
      } else {
        this.currentAnimation = null;
        return;
      }
    }

    const t = easeInOutCubic(this.t);

    const pose = this.lerpPose(t);
    const endpoints = this.legs.map((_, index) => this.lerpEndpoints[index](t));

    let success = this.updateBodyIK(pose, endpoints);

    if (!success) {
      console.log("Invalid state! Ending animation.");
      this.dispatchEvent(
        new CustomEvent(Events.HexapodAnimationStopped, {
          detail: {
            animation: this.currentAnimation,
            reason: "IK FAILURE",
          },
        })
      );
      this.currentAnimation = null;
      return;
    }

    this.lastEndpoints = endpoints;

    this.t += timescale * delta;
    if (this.t > 1) this.t = 1;
  }

  /**
   * Sets the hexapod's body pose
   * @param {Pose} pose - The pose to be applied
   */
  setPose(pose: Pose) {
    this.mesh.position.x = pose.x;
    this.mesh.position.y = pose.y;
    this.mesh.position.z = pose.z;

    this.mesh.rotation.x = pose.roll;
    this.mesh.rotation.y = pose.pitch;
    this.mesh.rotation.z = pose.yaw;

    this.dispatchEvent(
      new CustomEvent(Events.HexapodPoseUpdate, {
        detail: {
          pose: pose,
        },
      })
    );
  }

  /**
   * Updates the body using forward kinematics
   * @param {Pose} pose - The desired body pose
   * @param {Array<JointAngles>} joints - The joint joints for the legs
   * @returns {boolean | Array<THREE.Vector3>} - False if
   * update fails, or updated endpoints
   */
  updateBodyFK(
    pose: Pose,
    joints: Array<JointAngles>
  ): boolean | Array<THREE.Vector3> {
    console.log(joints);

    const endpoints: Array<THREE.Vector3> = this.legs.map((leg, index) =>
      leg.calculateForwardKinematics(pose, joints[index])
    );

    let success = this.updateBodyIK(pose, endpoints as Array<THREE.Vector3>);

    if (!success) return false;

    return endpoints;
  }

  /**
   * Updates the body using inverse kinematics
   * @param {Pose} pose - The desired body pose
   * @param {Array<THREE.Vector3>} endpoints - The target
   * endpoints for the legs
   * @returns {boolean} - True if successful, false
   * otherwise
   */
  updateBodyIK(pose: Pose, endpoints: Array<THREE.Vector3>): boolean {
    const joints: (boolean | JointAngles)[] = this.legs.map((leg, index) =>
      leg.calculateInverseKinematics(pose, endpoints[index])
    );

    const success = joints.every((angles) => angles !== false);

    // success ? console.log("IK success!") : console.log("IK failure!");

    if (!success) {
      return false;
    }

    this.setPose(pose);

    this.legs.map((leg, index) => {
      leg.setJointAngles(pose, <JointAngles>joints[index]);
    });

    this.dispatchEvent(
      new CustomEvent(Events.HexapodEndpointPositionsUpdate, {
        detail: {
          endpoints: endpoints,
        },
      })
    );

    this.dispatchEvent(
      new CustomEvent(Events.HexapodJointAnglesUpdate, {
        detail: {
          jointAngles: joints,
        },
      })
    );

    return true;
  }
}

function dumpV3(id: string, title: string, v: THREE.Vector3 | THREE.Vector4) {
  // return;
  console.log(
    id,
    title,
    "x",
    v.x.toFixed(2),
    ",y",
    v.y.toFixed(2),
    ",z",
    (v.z * 100).toFixed(2)
  );
}
