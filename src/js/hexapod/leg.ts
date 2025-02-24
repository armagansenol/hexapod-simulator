import * as THREE from "three";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { config } from "../configuration.ts";
import {
  deg2rad,
  rad2deg,
  sampleCircle,
  sq,
  sqrt,
  V3,
  createSphere,
  createCylinderAligned,
  createLine,
  numberToHexString,
} from "../utils";
import { Events, JointAngles, Pose } from "./common";

export class Leg extends EventTarget {
  public id: number;
  public scene: THREE.Scene;
  public femurLength: number;
  public tibiaLength: number;

  private origin: THREE.Vector3;
  public localFrame: THREE.Object3D;
  public coxa: THREE.Mesh;
  private femur: THREE.Line;
  private tibia: THREE.Line;

  private localFramePosition: THREE.Vector3;
  private localFrameRotation: THREE.Euler;

  private FKMatrices: {
    T1: THREE.Matrix4;
    T2: THREE.Matrix4;
    T3: THREE.Matrix4;
    T1_rotated: THREE.Matrix4;
    T12: THREE.Matrix4;
    T123: THREE.Matrix4;
    baseRotation: THREE.Matrix4;
    reverseRotation: THREE.Matrix4;
  };

  constructor(id: number, origin: THREE.Vector3, scene: THREE.Scene) {
    super();
    this.id = id;
    this.scene = scene;
    this.origin = origin;
    this.femurLength = config.hexapod.femur.length;
    this.tibiaLength = config.hexapod.tibia.length;

    this.createHierarchy();

    this.localFramePosition = new THREE.Vector3();
    this.localFrameRotation = new THREE.Euler();

    this.FKMatrices = {
      T1: new THREE.Matrix4(),
      T2: new THREE.Matrix4(),
      T3: new THREE.Matrix4(),
      T1_rotated: new THREE.Matrix4(),
      T12: new THREE.Matrix4(),
      T123: new THREE.Matrix4(),
      baseRotation: new THREE.Matrix4(),
      reverseRotation: new THREE.Matrix4(),
    };

    // this.oldX = 0;
    // this.oldY = 0;
    // this.oldZ = 0;
  }

  /**
   * Creates the THREE.Object3D hierarchy for this leg.
   */
  createHierarchy(): void {
    const angle = this.id * (Math.PI / 3);

    this.localFrame = this.createLocalFrame();

    // Create the coxa joint
    this.coxa = this.createCoxa();
    this.localFrame.add(this.coxa);

    // Create the femur segment
    this.femur = this.createFemur();
    this.coxa.add(this.femur);

    // Translate the femur along the x-axis to account for
    // the coxa length
    this.femur.position.set(config.hexapod.coxa.length, 0, 0);
    // this.femur.updateMatrixWorld();

    this.tibia = this.createTibia();
    this.femur.add(this.tibia);

    this.tibia.position.set(this.femurLength, 0, 0);
    // this.tibia.updateMatrixWorld();

    this.scene.add(this.localFrame);

    this.localFrame.updateMatrixWorld(true);
  }

  saveLocalFramePose() {
    this.localFramePosition.copy(this.localFrame.position);
    this.localFrameRotation.copy(this.localFrame.rotation);
  }

  restoreLocalFramePose() {
    this.localFrame.position.copy(this.localFramePosition);
    this.localFrame.rotation.copy(this.localFrameRotation);
    this.localFrame.updateMatrixWorld(true);
  }

  /**
   * Creates a local coordinate frame (transformation) with specified origin and rotation.
   *
   * @returns {THREE.Object3D} A THREE.Object3D representing the local coordinate frame for this leg's local frame.
   */
  createLocalFrame(): THREE.Object3D {
    const frame = new THREE.Object3D();
    frame.position.set(this.origin.x, this.origin.y, this.origin.z);
    frame.rotateZ(this.id * (Math.PI / 3));
    frame.updateMatrixWorld();

    return frame;
  }

  /**
   * Creates the sphere to indicate the coxa
   *
   * @returns {THREE.Mesh} - The coxa mesh
   */
  createCoxa(): THREE.Mesh {
    const sphere = createSphere({
      color: config.hexapod.coxa.color,
      radius: config.hexapod.coxa.radius,
    });
    sphere.scale.z = 1;
    return sphere;
  }

  /**
   * Creates the femur mesh with the hierarchy:
   * Line->Cylinder hierarchy
   *
   * @returns {THREE.Line} - The femur mesh
   */
  createFemur(): THREE.Line {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(this.femurLength, 0, 0),
    ];

    const mesh = createLine(points, config.hexapod.femur.color);

    const cylinder = createCylinderAligned({
      points: points,
      radiusTop: config.hexapod.femur.radiusTop,
      radiusBottom: config.hexapod.femur.radiusBottom,
      color: config.hexapod.femur.color,
    });

    mesh.add(cylinder);

    return mesh;
  }

  /**
   * Creates the tibia mesh with the hierarchy:
   * Line->Cylinder hierarchy
   *
   * @returns {THREE.Line} - The tibia mesh
   */
  createTibia(): THREE.Line {
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(this.tibiaLength, 0, 0),
    ];

    let mesh = createLine(points, config.hexapod.tibia.color);

    const cylinder = createCylinderAligned({
      points: points,
      radiusTop: config.hexapod.tibia.radiusTop,
      radiusBottom: config.hexapod.tibia.radiusBottom,
      color: config.hexapod.tibia.color,
    });

    const sphere = createSphere({
      color: config.hexapod.colorKnee,
      radius: 0.06,
    });

    mesh.add(sphere);
    mesh.add(cylinder);

    return mesh;
  }

  setCoxaAngle(radians: number) {
    this.coxa.rotation.z = radians;
    this.coxa.updateMatrixWorld();
  }

  setFemurAngle(radians: number) {
    this.femur.rotation.y = radians;
    this.femur.updateMatrixWorld();
  }

  setTibiaAngle(radians: number) {
    this.tibia.rotation.y = radians;
    this.tibia.updateMatrixWorld();
  }

  getCoxaAngle() {
    return this.coxa.rotation.z;
  }

  getFemurAngle() {
    return this.femur.rotation.y;
  }

  getTibiaAngle() {
    return this.tibia.rotation.y;
  }

  updateLocalFrame(pose: Pose) {
    const id = `LEG-${this.id}`;

    // console.groupCollapsed(id, "updateLocalFrame");

    const euler = new THREE.Euler(pose.roll, pose.pitch, pose.yaw);

    const translation = new THREE.Vector3(pose.x, pose.y, pose.z);

    const origin = this.origin.clone();

    // console.log(id, "Origin initial", {
    //   x: origin.x.toFixed(2), y: origin.y.toFixed(2), z: origin.z.toFixed(2),
    // })

    origin.add(translation);

    // console.log(id, "Origin after translation", {
    //   x: origin.x.toFixed(2), y: origin.y.toFixed(2), z: origin.z.toFixed(2),
    // })

    origin.applyEuler(euler);

    // console.log(id, "Origin after applying euler", {
    //   x: origin.x.toFixed(2), y: origin.y.toFixed(2), z: origin.z.toFixed(2),
    // })

    // console.log(id, "Local frame position before", {
    //   x: this.localFrame.position.x.toFixed(2), y: this.localFrame.position.y.toFixed(2), z: this.localFrame.position.z.toFixed(2),
    // })


    this.localFrame.position.set(origin.x, origin.y, origin.z);

    // console.log(id, "Local frame position after", {
    //   x: this.localFrame.position.x.toFixed(2), y: this.localFrame.position.y.toFixed(2), z: this.localFrame.position.z.toFixed(2),
    // })

    // console.groupEnd();

    this.localFrame.updateMatrixWorld(true);
  }

  /**
   * Updates the joint angles of this leg to the given
   * angles.
   *
   * @param {Pose} pose - The position, and rotation of
   * the body
   * @param {JointAngles} angles - The angles alpha, beta,
   * and gamma.
   */
  setJointAngles(pose: Pose, angles: JointAngles): void {
    this.updateLocalFrame(pose);

    this.coxa.rotation.z = angles.gamma;
    this.femur.rotation.y = angles.beta;
    this.tibia.rotation.y = angles.alpha;

    this.localFrame.updateMatrixWorld(true);
  }

  /**
   * Calculates the joint angles required for the endpoint
   * to achieve the desired position.
   *
   * Does not actually move the leg!
   *
   * @param {Pose} pose - The position, and rotation of
   * the body
   * @param {THREE.Vector3} targetPosition - The position
   * to move the endpoint to (in world co-ordinates w.r.t.
   * leg 0)
   * @returns {boolean | JointAngles} - Returns false if no
   * solution was found, otherwise returns the alpha, beta,
   * and gamma angles for the tibia, femur, and coxa
   * respectively.
   */
  calculateInverseKinematics(
    pose: Pose,
    targetPosition: THREE.Vector3,
  ): boolean | JointAngles {
    // targetPosition = targetPosition.clone().sub(this.scene.getObjectByName("hexapod")?.position)

    const id = `LEG-${this.id}`;

    if (targetPosition.z < -0.1) {
      // targetPosition.z = 0;
      return false;
      // let value = Number((targetPosition.z*100).toFixed(4))

      // console.log(value)
      // if (value < -2){
      //   console.log("old Z was", this.oldZ)
      //   targetPosition.z = this.oldZ
      // }
    }

    this.saveLocalFramePose();

    this.updateLocalFrame(pose);

    // Get the position of the local frame in world
    // co-ordinates
    const localFrameWorldPosition = new THREE.Vector3(0, 0, 0);

    this.localFrame.getWorldPosition(localFrameWorldPosition);

    const targetLocal = targetPosition.clone();

    // Create a rotation matrix to rotate the target
    // position to this leg. The target position is in
    // world co-ordinates but also w.r.t. leg 0.
    const rotationMatrix = new THREE.Matrix4();

    // rotationMatrix.makeRotationZ(this.id * (Math.PI / 3));
    rotationMatrix.makeRotationZ(this.id * (Math.PI / 3));

    targetLocal.applyMatrix4(rotationMatrix);

    // Finally, transform the rotated position to this
    // leg's local frame
    this.localFrame.worldToLocal(targetLocal);

    const F = this.femurLength;
    const T = this.tibiaLength;
    const FSquared = sq(F);
    const TSquared = sq(T);

    let x = 0,
      y = 0,
      z = 0;

    x = targetLocal.x;
    y = targetLocal.y;
    z = targetPosition.z;

    const xzProjection = sqrt(sq(x) + sq(y)) - config.hexapod.coxa.length;

    const h = localFrameWorldPosition.z;
    const ACSquared = sq(h - z) + sq(xzProjection);
    const AC = sqrt(ACSquared);

    // Calculate alpha (the tibia joint angle)
    let alpha = 0;

    alpha = Math.acos((TSquared + FSquared - ACSquared) / (2 * F * T));
    alpha = Math.PI - alpha;

    // Calculate beta (the femur joint angle)
    let beta1 = 0,
      beta2 = 0,
      beta = 0;

    beta1 = Math.acos((FSquared + ACSquared - TSquared) / (2 * F * AC));

    beta2 = Math.atan2(xzProjection, h - z);

    beta = beta1 + beta2;
    beta = Math.PI / 2 - beta;

    // Calculate gamma (the coxa joint angle)
    let gamma = 0;

    gamma = Math.atan2(y, x);
    if (gamma > Math.PI / 2) gamma = NaN;
    if (gamma < -Math.PI / 2) gamma = NaN;

    // Restore the local frame pose
    this.restoreLocalFramePose();

    if (isNaN(alpha) || isNaN(beta) || isNaN(gamma)) {
      console.log(id, "IK FAILED");
      return false;
    }

    if (localFrameWorldPosition.z <= config.hexapod.coxa.radius) {
      return false;
    }

    return {
      alpha: alpha,
      beta: beta,
      gamma: gamma,
    };
  }

  /**
   * Calculates the endpoint position given the joint angles
   *
   * Does not actually move the leg!
   *
   * @param {Pose} pose - The position, and rotation of the body
   * @param {JointAngles} angles - The position to move the endpoint to (in world co-ordinates w.r.t. leg 0)
   * @returns {THREE.Vector3} - Returns the position the
   * endpoint would be with the joints at the given angles.
   */
  calculateForwardKinematics(
    pose: Pose,
    angles: JointAngles
  ): THREE.Vector3 {
    const id = `LEG-${this.id}`;
    const alpha = angles.alpha;
    const beta = angles.beta;
    const gamma = angles.gamma;

    console.log(id, "Computing FK for: ", alpha, beta, gamma);

    this.saveLocalFramePose();

    this.updateLocalFrame(pose);

    // Construct the transformation matrices using
    // Denavit–Hartenberg parameters
    const T1 = updateDHMatrix(this.FKMatrices.T1, {
      linkLength: 0,
      linkTwist: Math.PI / 2,
      linkOffset: 0,
      // linkOffset: -config.hexapod.coxa.length,
      jointAngle: gamma,
    });

    const T2 = updateDHMatrix(this.FKMatrices.T2, {
      linkLength: this.femurLength,
      linkTwist: 0,
      linkOffset: 0,
      jointAngle: beta,
    });

    const T3 = updateDHMatrix(this.FKMatrices.T3, {
      linkLength: this.tibiaLength,
      linkTwist: 0,
      linkOffset: 0,
      jointAngle: alpha,
    });

    const baseRotation = this.FKMatrices.baseRotation;

    baseRotation.makeRotationZ(this.id * (Math.PI / 3));

    baseRotation.setPosition(
      this.localFrame.position.x,
      this.localFrame.position.y,
      0
    );

    const T1_rotated = this.FKMatrices.T1_rotated.multiplyMatrices(
      baseRotation,
      T1
    );
    const T12 = this.FKMatrices.T12.multiplyMatrices(T1_rotated, T2);
    const T123 = this.FKMatrices.T123.multiplyMatrices(T12, T3);

    const origin = new THREE.Vector4(0, 0, 0, 1);

    // const J1 = origin.clone().applyMatrix4(T1);
    // const J2 = origin.clone().applyMatrix4(T12);
    const J3 = origin.clone().applyMatrix4(T123);

    dumpV3(id, "J3: ", J3);
    const worldPosition = new THREE.Vector3(J3.x, J3.y, J3.z);

    this.localFrame.worldToLocal(worldPosition);
    dumpV3(id, "local", worldPosition);

    const finalPosition = worldPosition.clone();

    const reverseRotation = this.FKMatrices.reverseRotation;

    reverseRotation.makeRotationZ(this.id * (-Math.PI / 3));

    this.localFrame.localToWorld(finalPosition);

    finalPosition.applyMatrix4(reverseRotation);

    finalPosition.z = -worldPosition.z;

    dumpV3(id, "final", finalPosition);

    this.restoreLocalFramePose();
    // let _z = finalPosition.z * 10
    // _z = Number(_z.toFixed(2))

    // console.log(id, "final z = ", _z);
    // if (finalPosition.z < 0) {
    //   console.log(id, "FOOT GOING THROUGH THE FLOOR!")
    // }
    // if(_z < 0 || _z === -0){
    //   console.log("limit reached")
    // }

    return finalPosition;
  }
}

interface DHParameters {
  linkLength: number;
  linkTwist: number;
  linkOffset: number;
  jointAngle: number;
}

function createDHMatrix({ linkLength, linkTwist, linkOffset, jointAngle }) {
  const a = linkLength;
  const alpha = linkTwist;
  const d = linkOffset;
  const theta = jointAngle;

  const cTheta = Math.cos(theta);
  const sTheta = Math.sin(theta);
  const cAlpha = Math.cos(alpha);
  const sAlpha = Math.sin(alpha);

  // prettier-ignore
  const T = new THREE.Matrix4(
    cTheta, -sTheta * cAlpha, sTheta * sAlpha, a * cTheta,
    sTheta, cTheta * cAlpha, -cTheta * sAlpha, a * sTheta,
    0, sAlpha, cAlpha, d,
    0, 0, 0, 1
  )

  return T;
}

function updateDHMatrix(
  matrix: THREE.Matrix4,
  { linkLength, linkTwist, linkOffset, jointAngle }
) {
  const a = linkLength;
  const alpha = linkTwist;
  const d = linkOffset;
  const theta = jointAngle;

  const cTheta = Math.cos(theta);
  const sTheta = Math.sin(theta);
  const cAlpha = Math.cos(alpha);
  const sAlpha = Math.sin(alpha);

  // prettier-ignore
  const T = matrix.set(
    cTheta, -sTheta * cAlpha, sTheta * sAlpha, a * cTheta,
    sTheta, cTheta * cAlpha, -cTheta * sAlpha, a * sTheta,
    0, sAlpha, cAlpha, d,
    0, 0, 0, 1
  )

  return T;
}

function dumpV3(id: string, title: string, v: THREE.Vector3 | THREE.Vector4) {
  return;
  console.log(
    id,
    title,
    "x",
    v.x.toFixed(2),
    ",y",
    v.y.toFixed(2),
    ",z",
    v.z.toFixed(2)
  );
}
