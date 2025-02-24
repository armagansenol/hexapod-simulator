import * as THREE from 'three';
import { config } from '../configuration.ts';
import {
  Events,
  JointAngles,
  Pose,
} from './common';
import {
  sampleCircle,
} from '../utils';
import { Leg } from './leg';

export class Hexapod extends EventTarget {
  public scene: THREE.Scene;

  public legs: Array<Leg>;
  private mesh: THREE.Mesh;
  /**
   * Creates an instance of a hexapod
   * @param {THREE.Scene} scene - The Three.js scene where the hexapod exists
   */
  constructor(scene: THREE.Scene) {
    super();

    this.scene = scene;

    const coxaPoints = this.calculateCoxaPoints();

    this.legs = this.createLegs(coxaPoints);

    this.mesh = this.createMesh(coxaPoints);

    scene.add(this.mesh);
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
      config.hexapod.coxa.scale.z,
    );

    const scaledPoints = points.map((pt) =>
      pt.applyMatrix4(matrix),
    );

    return scaledPoints;
  }

  /**
   * Creates a new extrude geometry based on the shape created by the provided points
   * 
   * @param {Array<THREE.Vector2>} points - An array of 
   * coxa x and y positions.  
   * @returns {THREE.ExtrudeGeometry} - The extruded 
   * geometry resulting from the points
   */
  createExtrudeGeometry(points: Array<THREE.Vector2>): THREE.ExtrudeGeometry {
    const shape = new THREE.Shape(points);

    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      curveSegments: 3,
      bevelSize: 0.1 * 2,
      bevelOffset: -0.15,
      bevelSegments: 32,
    };

    return new THREE.ExtrudeGeometry(
      shape,
      extrudeSettings,
    );
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

    const shapePoints = points.map(
      (point) => new THREE.Vector2(point.x, point.y),
    );

    const material = new THREE.MeshPhysicalMaterial({
      iridescence: 1,
      color: config.hexapod.body.color,
    });

    const mesh = new THREE.Mesh(this.createExtrudeGeometry(shapePoints), material);

    mesh.scale.set(config.hexapod.body.scale.x, config.hexapod.body.scale.y, config.hexapod.body.scale.z)

    mesh.castShadow = config.shadows;
    mesh.receiveShadow = config.shadows;

    return mesh;
  }

  /**
   * Updates the mesh geometry to reflect the new coxa 
   * joint positions.
   */
  updateMesh() {
    const shapePoints = this.legs.map((leg) => {
      const position = new THREE.Vector3();
      leg.localFrame.getWorldPosition(position);
      return new THREE.Vector2(position.x, position.y);
    });

    this.mesh.geometry.dispose();

    this.mesh.geometry =
      this.createExtrudeGeometry(shapePoints);
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
      const leg = new Leg(
        legIndex,
        coxaPoints[legIndex],
        this.scene,
      );
      legs.push(leg);
    });
    return legs;
  }

  /**
   * Sets the hexapod's body pose
   * @param {Pose} pose - The pose to be applied
   */
  setPose(pose: Pose) {
    // Ignoring x, y, and z because the mesg
    this.updateMesh();

    // this.mesh.position.x = pose.x;
    // this.mesh.position.y = pose.y;
    this.mesh.position.z = pose.z;

    this.mesh.rotation.x = pose.roll;
    this.mesh.rotation.y = pose.pitch;
    // this.mesh.rotation.z = pose.yaw;

    this.mesh.updateMatrixWorld(true);

    this.dispatchEvent(
      new CustomEvent(Events.HexapodPoseUpdate, {
        detail: {
          pose: pose,
        },
      }),
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
    joints: Array<JointAngles>,
  ): boolean | Array<THREE.Vector3> {
    // console.log(joints);

    const endpoints: Array<THREE.Vector3> = this.legs.map(
      (leg, index) =>
        leg.calculateForwardKinematics(pose, joints[index]),
    );

    let success = this.updateBodyIK(
      pose,
      endpoints as Array<THREE.Vector3>,
    );

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
  updateBodyIK(
    pose: Pose,
    endpoints: Array<THREE.Vector3>,
  ): boolean {
    const joints: (boolean | JointAngles)[] = this.legs.map(
      (leg, index) =>
        leg.calculateInverseKinematics(
          pose,
          endpoints[index],
        ),
    );

    const success = joints.every(
      (angles) => angles !== false,
    );

    // success ? console.log("IK success!") : console.log("IK failure!");

    if (!success) {
      return false;
    }

    this.legs.map((leg, index) => {
      leg.setJointAngles(pose, <JointAngles>joints[index]);
    });

    this.setPose(pose);

    this.dispatchEvent(
      new CustomEvent(
        Events.HexapodEndpointPositionsUpdate,
        {
          detail: {
            endpoints: endpoints,
          },
        },
      ),
    );

    this.dispatchEvent(
      new CustomEvent(Events.HexapodJointAnglesUpdate, {
        detail: {
          jointAngles: joints,
        },
      }),
    );

    return true;
  }
}
