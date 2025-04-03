import * as THREE from "three"
import { config } from "../configuration"
import { Hexapod } from "./body"

import { JointAngles, Pose, Category } from "./common"

export class Model extends EventTarget {
  public pose: Pose
  public endpoints: Array<THREE.Vector3>
  public joints: Array<JointAngles>

  private hexapod: Hexapod
  private selectedLegs: Array<number>
  private category: Category

  constructor() {
    super()
    this.selectedLegs = []

    // The position, and orientation of the center-mass
    // of the hexapod
    this.pose = {
      x: 0,
      y: 0,
      z: config.hexapod.body.height,
      roll: 0,
      pitch: 0,
      yaw: 0,
    }

    this.endpoints = []

    this.joints = []

    for (let i = 0; i < 6; i++) {
      this.endpoints.push(new THREE.Vector3(1, 0, 0))

      this.joints.push({ gamma: 0, beta: 0, alpha: 0 })
    }
  }

  setHexapod(hexapod: Hexapod) {
    this.hexapod = hexapod
  }

  setAngles(id: number, angles: JointAngles) {
    this.joints[id].alpha = angles.alpha
    this.joints[id].beta = angles.beta
    this.joints[id].gamma = angles.gamma
  }

  setEndpoint(id: number, endpoint: THREE.Vector3) {
    this.endpoints[id].copy(endpoint)
  }

  setAttribute(attr: keyof Model, val: unknown) {
    ;(this as unknown as Record<string, unknown>)[attr] = val
  }

  getAttribute(attr: keyof Model): unknown {
    return (this as unknown as Record<string, unknown>)[attr]
  }

  setSelectedLegIndexes(value: Array<number>) {
    this.selectedLegs.length = 0
    this.selectedLegs.push(...value)
  }

  getSelectedLegIndexes(): Array<number> {
    return this.selectedLegs
  }

  setCategory(value: Category) {
    this.category = value
  }

  getCategory(): Category {
    return this.category
  }

  setEndpoints(endpoints: Array<THREE.Vector3>) {
    endpoints.forEach((endpoint, index) => {
      this.endpoints[index].copy(endpoint)
    })
  }

  setJoints(joints: Array<JointAngles>) {
    joints.forEach((angles, index) => {
      this.joints[index].gamma = angles.gamma
      this.joints[index].beta = angles.beta
      this.joints[index].alpha = angles.alpha
    })
  }
}
