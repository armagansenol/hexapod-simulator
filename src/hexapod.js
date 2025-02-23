import * as THREE from "three";
import { MeshLineGeometry, MeshLineMaterial, raycast } from "meshline";
import {
  acos,
  atan2,
  cos,
  deg2rad,
  rad2deg,
  rotateLeft,
  sampleCircle,
  sin,
  sq,
  sqrt,
  V3,
} from "./utils";

import { conf } from "./js/configuration";

export class HexapodController {
  constructor(hexapod) {
    this.hexapod = hexapod;
    this.scene = this.hexapod.scene;
    setupInputs();
    // return;
    this.setupLegSelectionInputs();
    this.setupJointAngleInputs();
    this.setupPositionInputs();
    this.setupBodyPoseInputs();
    this.selectedLegs = new Set([0]);

    // const targetPosition = new V3(
    //   Number(document.getElementById("x-position").value),
    //   0,
    //   0
    // );
    // this.hexapod.legs.forEach((leg) => {
    //   leg.calculateInverseKinematics(targetPosition);
    // });
  }

  setupBodyPoseInputs() {
    const bodyInputs = {
      x: document.getElementById("body-position-x"),
      y: document.getElementById("body-position-y"),
      z: document.getElementById("body-position-z"),
      roll: document.getElementById("body-roll"),
      pitch: document.getElementById("body-pitch"),
      yaw: document.getElementById("body-yaw"),
    }
    const inputs = Object.values(bodyInputs);

    inputs.forEach((el) => {
      el.value = 0;
      el.min = -1;
      el.max = 1;
      el.step = "any"
      el.addEventListener("input", this.handleBodyPoseInput.bind(this));
    })
    bodyInputs.z.value = -conf.hexapod.height;

    bodyInputs.roll.min = deg2rad(-45);
    bodyInputs.roll.max = deg2rad(45);
    bodyInputs.pitch.min = deg2rad(-45);
    bodyInputs.pitch.max = deg2rad(45);
    bodyInputs.yaw.min = deg2rad(-95);
    bodyInputs.yaw.max = deg2rad(90);

    // bodyInputs.x.min = -1;
    this.bodyInputs = bodyInputs;
  }

  handleBodyPositionInput(event) {

    console.log("event: ", event)
    // let mesh = this.hexapod.baseMesh;
    // mesh.position.x = event.value
    // let retval = true
    // const targetPosition = new V3(
    //   Number(0.6),
    //   0,
    //   0
    // );
    // this.hexapod.legs.forEach((leg) => {
    //   if (retval) {
    //     retval = leg.calculateInverseKinematics(targetPosition);
    //   }
    // });
  }

  handleBodyPoseInput(event) {
    console.log(event.target.value)
    const hexapod = this.hexapod;
    const bodyInputs = this.bodyInputs;
    const body = {
      x: -bodyInputs.x.value,
      y: -bodyInputs.y.value,
      z: -bodyInputs.z.value,
      roll: bodyInputs.roll.value,
      pitch: bodyInputs.pitch.value,
      yaw: bodyInputs.yaw.value,
    }
    const leg = new V3(1, 0, 0);
    hexapod.setPose(body, leg)
    // let id = event.target.id;
    // let newValue = Number(event.target.value);
    // let oldValue;
    // let mesh = this.hexapod.baseMesh;
    // let undo;
    // if (id === "roll-angle") {
    //   oldValue = mesh.rotation.y;
    //   undo = () => {
    //     mesh.rotation.y = oldValue;
    //     event.target.value = rad2deg(oldValue) * 5;
    //   };
    //   mesh.rotation.y = deg2rad(newValue) / 5;
    // } else if (id === "pitch-angle") {
    //   oldValue = mesh.rotation.x;
    //   undo = () => {
    //     mesh.rotation.x = oldValue;
    //     event.target.value = rad2deg(oldValue) * 5;
    //   };
    //   mesh.rotation.x = deg2rad(newValue) / 5;
    // } else if (id === "yaw-angle") {
    //   oldValue = mesh.rotation.z;
    //   undo = () => {
    //     mesh.rotation.z = oldValue;
    //     event.target.value = rad2deg(oldValue) * 5;
    //   };
    //   mesh.rotation.z = deg2rad(newValue) / 5;
    // } else if (id === "body-x-position") {
    //   oldValue = mesh.position.x;
    //   undo = () => {
    //     mesh.position.x = oldValue;
    //     event.target.value = oldValue * 100;
    //   };
    //   mesh.position.x = newValue / 100;
    // } else if (id === "body-y-position") {
    //   oldValue = mesh.position.y;
    //   undo = () => {
    //     mesh.position.y = oldValue;
    //     event.target.value = oldValue * 100;
    //   };
    //   mesh.position.y = newValue / 100;
    // } else if (id === "body-z-position") {
    //   oldValue = mesh.position.z;
    //   undo = () => {
    //     mesh.position.z = oldValue;
    //     event.target.value = oldValue * 50;
    //   };
    //   mesh.position.z = newValue / 50;
    // }

    // event.target.nextElementSibling.innerHTML = newValue;

    // const targetPosition = new V3(
    //   Number(document.getElementById("x-position").value),
    //   0,
    //   0
    // );

    // let retval = true;
    // this.hexapod.legs.forEach((leg) => {
    //   if (retval) {
    //     retval = leg.calculateInverseKinematics(targetPosition);
    //   }
    // });
    // if (!retval) {
    //   console.log("\n\nFAILURE!\n\n ");
    //   undo();
    // }
  }

  setupLegSelectionInputs() {
    const target = document.getElementById("leg-selector-checkbox-grid");

    let innerHTML = "";
    for (let i = 1; i <= 6; i++) {
      innerHTML =
        innerHTML +
        `<div>
              <input
              type="checkbox"
              id="hexapod-leg-${i}"
              value=${i}
              ${i == 1 ? "checked" : ""}
              />
              <label for="hexapod-leg-${i}">leg ${i}</label>
          </div>`;
    }
    target.innerHTML = innerHTML;

    for (let i = 1; i <= 6; i++) {
      const checkbox = document.getElementById(`hexapod-leg-${i}`);
      checkbox.addEventListener(
        "change",
        this.handleLegSelectionInput.bind(this)
      );
    }
  }

  handleLegSelectionInput(event) {
    const checked = event.target.checked;
    const value = Number(event.target.value) - 1;
    if (checked) {
      this.selectedLegs.add(value);
    } else {
      this.selectedLegs.delete(value);
    }

    const angleInputSliders = [
      document.getElementById("coxa-angle"),
      document.getElementById("femur-angle"),
      document.getElementById("tibia-angle"),
    ];

    if (this.selectedLegs.size === 1) {
      const legIndex = this.selectedLegs.values().next().value;
      const leg = this.hexapod.legs[legIndex];
      let angle;
      angle = leg.getCoxaAngle();
      angleInputSliders[0].value = angle;
      angleInputSliders[0].nextElementSibling.innerHTML = `${angle}°`;

      angle = leg.getFemurAngle();
      angleInputSliders[1].value = angle;
      angleInputSliders[1].nextElementSibling.innerHTML = `${angle}°`;

      angle = leg.getTibiaAngle();
      angleInputSliders[2].value = angle;
      angleInputSliders[2].nextElementSibling.innerHTML = `${angle}°`;
    }

    if (this.selectedLegs.size === 0) {
      for (let i = 0; i < 3; i++) {
        angleInputSliders[i].value = 0;
        angleInputSliders[i].nextElementSibling.innerHTML = `0°`;
      }
    }
    console.log("Selected legs: ", this.selectedLegs);
  }

  /**
   * Registers the event handlers for the joint angle
   * inputs
   */
  setupJointAngleInputs() {
    const angleInputSliders = [
      document.getElementById("coxa-angle"),
      document.getElementById("femur-angle"),
      document.getElementById("tibia-angle"),
    ];

    angleInputSliders.forEach((slider) => {
      slider.addEventListener("input", this.handleJointAngleInput.bind(this));
    });
  }

  /**
   * Updates the joint angle of the selected leg(s)
   */
  handleJointAngleInput(event) {
    if (this.selectedLegs.size === 0) {
      console.log("No leg(s) selected!");
      return;
    }
    const target = event.target.id;
    const angle = event.target.value;

    event.target.nextElementSibling.innerHTML = `${angle}°`;

    if (target === "coxa-angle") {
      this.selectedLegs.forEach((legIndex) => {
        this.hexapod.legs[legIndex].updateCoxaAngle(angle);
      });
    } else if (target === "femur-angle") {
      this.selectedLegs.forEach((legIndex) => {
        this.hexapod.legs[legIndex].updateFemurAngle(angle);
      });
    } else if (target === "tibia-angle") {
      this.selectedLegs.forEach((legIndex) => {
        this.hexapod.legs[legIndex].updateTibiaAngle(angle);
      });
    }
  }

  /**
   * Registers the input handler for the end
   * effector position inputs and sets the initial
   * of the inputs
   */
  setupPositionInputs() {
    let el;
    el = document.getElementById("x-position");
    el.addEventListener("input", this.handlePositionInput.bind(this));
    // el.value = conf.hexapod.femur.length + conf.hexapod.radius;
    el.value = 0.6;

    el = document.getElementById("y-position");
    el.addEventListener("input", this.handlePositionInput.bind(this));
    el.value = 0;

    this.xValue = 0.6;
    this.yValue = 0;
  }

  /**
   * Triggers IK calculations when the input
   * position changes
   */
  handlePositionInput(event) {
    const xValue = Number(document.getElementById("x-position").value);
    const yValue = Number(document.getElementById("y-position").value);

    // const leg = this.hexapod.legs[0];
    const targetPosition = new V3(xValue, yValue, 0);

    let result = true;

    this.hexapod.legs.forEach((leg) => {
      if (result) {
        result = leg.calculateInverseKinematics(targetPosition);
      }
    });

    if (result) {
      this.xValue = xValue;
      this.yValue = yValue;
    } else {
      document.getElementById("x-position").value = this.xValue;
      document.getElementById("y-position").value = this.yValue;
    }

    console.log(result);
  }
}

export class Hexapod {
  constructor(scene) {
    this.scene = scene;
    let points = this.getCoxaJointPositions();

    this.baseMesh = this.createBaseMesh(points);
    this.bodyMesh = this.createBodyMesh();
    this.baseMesh.position.set(0, 0, conf.hexapod.height);
    this.baseMesh.updateMatrixWorld();
    this.legs = this.createLegs(points);
    this.baseMesh.add(...this.legs.map((leg) => leg.group));
  }

  saveState() {
    const mesh = this.baseMesh;
    const position = mesh.position.clone();
    const rotation = mesh.rotation.clone();
    this.savedState = {
      position: position,
      rotation: rotation,
    }

    // Save legs
  }

  restoreState() {
    const mesh = this.baseMesh;
    const savedState = this.savedState;
    mesh.position.copy(savedState.position);
    mesh.rotation.copy(savedState.rotation);
    mesh.updateMatrixWorld()

    // Restore legs
  }

  setPose(body, legs) {
    this.saveState();
    const mesh = this.baseMesh;
    console.log("body: ", body)
    mesh.position.x = body.x || mesh.position.x;
    mesh.position.y = body.y || mesh.position.y;
    mesh.position.z = body.z || mesh.position.z;

    mesh.rotation.x = body.roll || mesh.rotation.x;
    mesh.rotation.y = body.pitch || mesh.rotation.y;
    mesh.rotation.z = body.yaw || mesh.rotation.z;

    mesh.updateMatrixWorld(true)
    mesh.updateWorldMatrix(true, true)

    let result = true;

    if (legs.isVector3) {
      console.log("Using same end effector position for all legs")

      this.legs.forEach((leg) => {
        if (result) {
          result = leg.calculateInverseKinematics(legs);
        }
      });
    }

    // if (result) {
    //   console.log("SUCCESS!")

    // } else {
    //   console.log("FAILURE!")
    //   this.restoreState();
    //   this.legs.forEach((leg)=>leg.restoreState())
    // }

  }

  getCoxaJointPositions() {
    const points = sampleCircle({
      radius: conf.hexapod.radius,
      interval: 60,
      offset: 0,
      z: 0,
    });
    // return rotateLeft(points);
    return points;
  }

  createBodyMesh() {
    const geometry = new THREE.CylinderGeometry(
      conf.hexapod.radius,
      conf.hexapod.radius,
      conf.hexapod.thickness,
      6
    );

    const material = new THREE.MeshBasicMaterial({
      color: conf.hexapod.bodyColor,
      transparent: true,
      opacity: 0.75,
      wireframe: false,
    });

    const bodyMesh = new THREE.Mesh(geometry, material);
    bodyMesh.rotateX(deg2rad(90));
    bodyMesh.rotation.order = "ZXY";
    bodyMesh.rotation.x = deg2rad(90);
    bodyMesh.position.z += conf.hexapod.height + conf.hexapod.thickness / 2;
    bodyMesh.rotation.z = 30 * (Math.PI / 180);
    return bodyMesh;
  }

  createBaseMesh(points) {
    const vertices = new Float32Array(points.length * 3);
    points.forEach((point, i) => {
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = point.z;
    });

    // Create indices for triangulation (fan triangulation)
    const indices = [];
    for (let i = 1; i < points.length - 1; i++) {
      indices.push(0, i, i + 1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    const material = new THREE.MeshBasicMaterial({
      color: conf.hexapod.bodyColor,
      side: THREE.DoubleSide,
      opacity: 0.5,
      wireframe: false,
      transparent: true,
    });
    return new THREE.Mesh(geometry, material);
  }

  createLegs(points) {
    const legs = [];
    let N;
    // N = points.length;
    // N = 2;
    let i = [0, 1,2,3,4,5];
    i.forEach((idx)=>{
      const leg = new Leg(idx, this.scene, points[idx], idx * 60 - 0);
      leg.hexapod = this;
      legs.push(leg);

    })
    // for (let i = 0; i < N; i++) {
      // if (i == 1 || i == 4) {
      // }
    // }
    return legs;
  }
}

class Leg {
  constructor(id, scene, origin, angle) {
    this.id = id;
    this.scene = scene;
    this.group = this.createLocalFrame(origin, angle);

    this.coxa = this.createCoxa();
    this.group.add(this.coxa);

    this.femur = this.createFemur();
    this.coxa.add(this.femur);
    this.femur.position.set(conf.hexapod.coxa.length, 0, 0);
    this.femur.updateMatrixWorld();

    this.tibia = this.createTibia();
    this.femur.add(this.tibia);
    this.tibia.position.set(conf.hexapod.femur.length, 0, 0);
    this.tibia.updateMatrixWorld();
    this.coxa.updateMatrixWorld();
    this.group.updateMatrixWorld();

    this.endEffectorPosition = V3();
  }

  saveState() {
    this.savedState = {
      alpha: this.tibia.rotation.y,
      beta: this.femur.rotation.y,
      gamma: this.coxa.rotation.z,
      endEffectorPosition: this.endEffectorPosition,
    }
  }

  restoreState() {
    const savedState = this.savedState;
    this.coxa.rotation.z = savedState.gamma;
    this.coxa.updateMatrixWorld();
    this.femur.rotation.y = savedState.beta;
    this.femur.updateMatrixWorld();
    this.tibia.rotation.y = savedState.alpha;
    this.tibia.updateMatrixWorld();
    this.group.updateMatrixWorld();
  }

  createMarker() {
    const geometry = new THREE.SphereGeometry(0.05);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.75,
    });

    const marker = new THREE.Mesh(geometry, material);

    return marker;
  }

  createLocalFrame(origin, angle) {
    const frameGeometry = new THREE.SphereGeometry(
      conf.hexapod.thickness / 3,
      12,
      12
    );
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: conf.hexapod.coxaFrameColor,
      wireframe: false,
      transparent: true,
      opacity: 0.75,
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.translateX(origin.x);
    frame.translateY(origin.y);
    frame.translateZ(origin.z);
    frame.rotateZ(deg2rad(angle));
    frame.updateMatrixWorld();

    // const gnomon = new THREE.AxesHelper(0.25);
    // gnomon.setColors(new THREE.Color('red'), new THREE.Color('green'), new THREE.Color('blue'))
    // frame.add(gnomon)
    return frame;
  }

  createLine(points, color) {
    const material = new THREE.LineBasicMaterial({
      color: color,
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    const mesh = new THREE.Line(geometry, material);
    return mesh;
  }

  createMeshLine(points, thickness, color) {
    const geometry = new MeshLineGeometry();
    geometry.setPoints(points);
    const material = new MeshLineMaterial({
      color: new THREE.Color(color),
      lineWidth: thickness,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.raycast = raycast;
    return mesh;
  }

  createLegSegment(points, thickness, color) {
    const meshLine = this.createMeshLine(points, thickness, color);
    // const gnomon = new THREE.AxesHelper(0.25);
    // gnomon.setColors(new THREE.Color('red'), new THREE.Color('green'), new THREE.Color('blue'))
    // meshLine.add(gnomon)
    return meshLine;
  }

  createCoxa() {
    const config = conf.hexapod;
    const points = [
      new V3(0, 0, 0),
      new V3(config.coxa.length, 0, 0),
    ];
    return this.createLegSegment(
      points,
      config.coxa.thickness,
      config.coxa.color
    );
  }

  createFemur() {
    const config = conf.hexapod;
    const points = [
      new V3(0, 0, 0),
      new V3(config.femur.length, 0, 0),
    ];
    return this.createLegSegment(
      points,
      config.femur.thickness,
      config.femur.color
    );
  }

  createTibia() {
    const config = conf.hexapod;
    const points = [
      new V3(0, 0, 0),
      new V3(config.tibia.length, 0, 0),
    ];
    return this.createLegSegment(
      points,
      config.tibia.thickness,
      config.tibia.color
    );
  }

  angleUpdateHandler(event) {
    const angle = event.target.value;
    const target = event.currentTarget.id;
    if (target == "coxa-angle") {
      this.updateCoxaAngle(angle);
    } else if (target == "femur-angle") {
      this.updateFemurAngle(angle);
    } else if (target == "tibia-angle") {
      this.updateTibiaAngle(angle);
    }
  }

  getEndEffectorPosition() {

  }

  _getEndEffectorPosition() {
    const localEndpoint = V3(conf.hexapod.tibia.length, 0, 0);
    const worldEndpoint = V3();

    this.tibia.updateMatrixWorld(true);

    worldEndpoint.copy(localEndpoint);

    worldEndpoint.applyMatrix4(this.tibia.matrixWorld);
    // console.log(
    //   `End Effector Position: X=${worldEndpoint.x.toFixed(
    //     2
    //   )}, Y=${worldEndpoint.y.toFixed(2)}, Z=${worldEndpoint.z.toFixed(2)}`
    // );
    return worldEndpoint;
  }

  updateCoxaAngle(angle) {
    this.coxa.rotation.z = THREE.MathUtils.degToRad(angle);
    this.coxa.updateMatrixWorld();
  }

  updateFemurAngle(angle) {
    this.femur.rotation.y = THREE.MathUtils.degToRad(angle);
    this.femur.updateMatrixWorld();

  }

  updateTibiaAngle(angle) {
    this.tibia.rotation.y = THREE.MathUtils.degToRad(angle);
    this.tibia.updateMatrixWorld();
  }

  getCoxaAngle() {
    return rad2deg(this.coxa.rotation.z);
  }

  getFemurAngle() {
    return rad2deg(this.femur.rotation.x);
  }

  getTibiaAngle() {
    return rad2deg(this.tibia.rotation.x);
  }

  calculateInverseKinematics(position) {
    function adjust(value) {
      return Number((value*10).toFixed(2))
    }
    function adjustPosition(pos) {
      return {
       x: adjust(pos.x),
       y: adjust(pos.y),
       z: adjust(pos.z) 
      }
    }
    this.saveState();
    console.log(`------ LEG ${this.id} ------`);
    let id = this.id;

    const coxa = this.coxa;
    const group = this.group;
    const hexapod = this.hexapod.baseMesh;
    const hexapodPosition = hexapod.position;
    const groupPosition = this.group.position;

    // Just a copy of the target position
    const targetPosition = position.clone();

    console.log("targetPosition (world): ", adjustPosition(targetPosition));

    console.log("hexapodPosition (world):", adjustPosition(hexapodPosition));

    const hexapodPositionLocal = hexapodPosition.clone();
    hexapod.getLocal
    console.log("hexapodPosition (local):", adjustPosition(hexapodPositionLocal));

    group.rotation.y = -hexapod.rotation.y
    group.rotation.x = -hexapod.rotation.x
    group.rotation.z = -hexapod.rotation.z

    group.updateMatrixWorld()
    hexapod.updateMatrixWorld()
    const groupPositionWorld = V3(0, 0, 0);

    group.getWorldPosition(groupPositionWorld);
    console.log("groupPosition (world): ", adjustPosition(groupPositionWorld));

    const groupQuaternion = group.getWorldQuaternion(new THREE.Quaternion());
    const groupEuler = new THREE.Euler().setFromQuaternion(groupQuaternion);
    console.log("Group rotation (degrees):", {
      x: rad2deg(groupEuler.x),
      y: rad2deg(groupEuler.y),
      z: rad2deg(groupEuler.z)
    });

    const targetLocal = targetPosition.clone();

    const rotationMatrix = new THREE.Matrix4();
    const a = new THREE.Euler(hexapod.rotation.x, hexapod.rotation.y, hexapod.rotation.z)
    const m = new THREE.Matrix4()
    m.makeRotationFromEuler(a);
    // m.invert();
    // targetLocal.applyMatrix4(m)
    console.log("a = ", a)
    rotationMatrix.makeRotationZ(deg2rad(this.id * 60))
    
    targetLocal.applyMatrix4(rotationMatrix)

    group.worldToLocal(targetLocal);
    console.log("Target in group local space:", adjustPosition(targetLocal));

    const F = conf.hexapod.femur.length;
    const T = conf.hexapod.tibia.length;
    const FSquared = sq(F);
    const TSquared = sq(T);

    let x, y, z;
    x = targetLocal.x;
    y = targetLocal.y;
    z =0;
    console.log(`x = ${x}, y = ${y}, z = ${z}`);

    const xzProjection = sqrt(sq(x) + sq(y)) - conf.hexapod.coxa.length;

    console.log("xzProjection = ", xzProjection);

    const h = groupPositionWorld.z 
    const ACSquared = sq(h - z) + sq(xzProjection);
    const AC = sqrt(ACSquared);

    let alpha;

    alpha = acos((TSquared + FSquared - ACSquared) / (2 * F * T));
    alpha = 180 - alpha;

    let beta1, beta2, beta;

    beta1 = acos((FSquared + ACSquared - TSquared) / (2 * F * AC));

    beta2 = atan2(xzProjection, h - z);

    beta = beta1 + beta2;
    beta = 90 - beta;

    let gamma;

    gamma = atan2(y, x);

    console.log(
      `Alpha = ${alpha}, Beta = ${beta.toFixed(2)} [90 - (${beta1.toFixed(
        2
      )} + ${beta2.toFixed(2)})], Gamma = ${gamma}`
    );


    if (isNaN(alpha) || isNaN(beta) || isNaN(gamma)) {
      return false;
    }

    this.updateTibiaAngle(alpha);
    this.updateFemurAngle(beta);
    this.updateCoxaAngle(gamma);

    this.endEffectorPosition.copy(position);
    console.log(this._getEndEffectorPosition())
    return true;
  }
}


function createGnomon({
  position = [0, 0, 0],
  length = 2,
  colorX = 0xff0000,
  colorY = 0x00ff00,
  colorZ = 0x0000ff,
}) {
  const origin = V3(...position);

  const xAxis = V3(1, 0, 0);
  xAxis.normalize();

  const yAxis = V3(0, 1, 0);
  yAxis.normalize();

  const zAxis = V3(0, 0, 1);
  zAxis.normalize();

  const gnomon = new THREE.Group();

  gnomon.add(
    new THREE.ArrowHelper(xAxis, origin, length, colorX),
    new THREE.ArrowHelper(yAxis, origin, length, colorY),
    new THREE.ArrowHelper(zAxis, origin, length, colorZ)
  );

  return gnomon;
}

function selectText(element) {
  if (document.body.createTextRange) {
    // For IE
    const range = document.body.createTextRange();
    range.moveToElementText(element);
    range.select();
  } else if (window.getSelection) {
    // For modern browsers
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

function assert(condition, message) {
  if (!condition) {
    throw message || "Assertion failed";
  }
}

class ReactiveSlider {
  constructor(name, value = 0, step = 1, min = 0, max = 100) {
    this._name = name
    this._min = Number(min)
    this._max = Number(max)
    this._value = Number(value);
    this._step = Number(step);
    this._subscribers = new Set();

    const rangeInputs = document.querySelectorAll(`[name=${name}][type="range"]`)

    assert(rangeInputs.length > 0, `ReactiveSlider: No range inputs found for ${name}`)

    rangeInputs.forEach((element) => {
      element.value = Math.round((value - min) / (max - min) * 100);
      element.min = 0
      element.max = 100
      element.addEventListener("input", this.onRangeInput.bind(this))
    })

    const numberInputs = document.querySelectorAll(`[name=${name}][type="number"]`)

    assert(numberInputs.length > 0, `ReactiveSlider: No number inputs found for ${name}`)

    numberInputs.forEach((element) => {
      element.value = value;
      element.step = step;
      element.addEventListener("blur", this.onSpinnerInput.bind(this))
      element.addEventListener('keydown', this.onKeyPress.bind(this));
      element.addEventListener("focus", this.handleSpinnerFocus.bind(this))
    })

    this.rangeInputs = rangeInputs;
    this.numberInputs = numberInputs;
  }

  handleSpinnerFocus(event) {
    event.target.select()
  }

  onRangeInput(event) {
    let percentageValue = Number(event.target.value);
    let rawValue = this.min + (percentageValue / 100) * (this.max - this.min);

    this.numberInputs.forEach((element) => {
      element.value = rawValue.toFixed(2);
    })
    this._value = rawValue;

    this._publish({
      value: Number(rawValue.toFixed(3)),
      percentage: percentageValue,
      name: this.name
    });
  }

  onSpinnerInput(event) {
    let rawValue = this.clip(Number(event.target.value));
    if (rawValue === this.value) return;
    rawValue = this.clip(rawValue);
    event.target.value = rawValue;

    let percentageValue = Math.round((rawValue - this.min) / (this.max - this.min)) * 100

    this.rangeInputs.forEach((element) => {
      element.value = percentageValue;
    })
    this._value = rawValue;

    this._publish({
      value: Number(rawValue),
      percentage: percentageValue,
      name: this.name
    });
  }

  onKeyPress(event) {
    if (event.key === 'Enter') {
      event.target.dispatchEvent(new Event('blur'));
    }
  }

  calculateRawValue(normalizedValue) {
    let rawValue = this.min + this.value * (normalizedValue);
    return rawValue;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    // console.log("setting value",value, this._value)
    if (value === this._value) return;

    value = this.clip(value);

    this.numberInputs.forEach((element) => {
      element.value = value;
    })

    let percentageValue = Math.round((value - this.min) / (this.max - this.min) * 100)

    this.rangeInputs.forEach((element) => {
      element.value = percentageValue;
    })

    this._value = value

    // this._publish({
    //   value: Number(value),
    //   percentage: percentageValue,
    //   name: this.name
    // });
  }

  get min() {
    return this._min;
  }

  set min(min) {
    this._min = min
  }

  get max() {
    return this._max;
  }

  set max(max) {
    this._max = max
  }

  get step() {
    return this._step;
  }

  set step(step) {
    this._step = step;
  }

  get name() {
    return this._name
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    console.log(this._subscribers)

  }

  unsubscribe(callback) {
    this._subscribers.delete(callback);
  }

  _publish(event) {
    // console.log("Publishing!")
    this._subscribers.forEach((callback) => {
      callback.call(this, event)
    })
  }

  clip(value) {

    if (value > this.max) return this.max;

    if (value < this.min) return this.min;

    return value;
  }
}

function clip(value, min, max) {

  if (value > max) return max;

  if (value < min) return min;

  return value;
}

function setupInputs() {
  console.log("Setting up inputs!")
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach((pageButton) => {
    pageButton.addEventListener("click", (e) => {
      const tabContainer = document.querySelector(".control-panel-tabs")
      const newIndex = Number(pageButton.dataset.index);
      const oldIndex = Number(tabContainer.dataset.index);

      tabButtons[oldIndex].removeAttribute("selected")
      tabButtons[newIndex].setAttribute("selected", "selected")
      tabContainer.dataset.index = newIndex

      const tabs = document.querySelectorAll(`article.control-group`)

      tabs[oldIndex].style.opacity = 0;
      tabs[newIndex].scrollIntoView({ behavior: 'smooth', block: 'start' })
      tabs[newIndex].style.opacity = 1
    })
  })
  tabButtons[0].click()


}

function createSVG() {
  // const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // console.log(svg)

  // const viewBox = svg.createSVGRect();
  // viewBox.x = 0;
  // viewBox.y = 0;
  // viewBox.width = 100;
  // viewBox.height = 100;

  // const hexagon = new SVGPolygonElement();


  return svg
}
