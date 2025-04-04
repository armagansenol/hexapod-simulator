import * as THREE from "three"
import { Timer } from "three/examples/jsm/Addons.js"
import { Hexapod } from "./body"
import { Model } from "./model"

const v3 = (x, y, z) => new THREE.Vector3(x, y, z)

const tClamp = (t: number) => {
  if (t > 1) return 1
  if (t < 0) return 0
  return t
}

const factorial = (n = 0) => (n === 0 ? 1 : factorial(n - 1) * n)

const binomialCoefficient = (n = 0, i = 0) => factorial(n) / (factorial(i) * factorial(n - i))

function linspace(min = 0, max = 1, n = 2): Array<number> {
  const pts: Array<number> = []
  const stride = (max - min) / (n - 1)

  for (let i = 0; i < n; i++) {
    pts.push(min + i * stride)
  }

  return pts
}

export class BezierCurve3D {
  private B: Array<THREE.Vector3>

  constructor() {
    this.B = []
  }

  length() {
    return this.B.length
  }

  addControlPoints(...vector) {
    this.B.push(...vector)
  }

  setControlPoints(arr: Array<THREE.Vector3>) {
    this.B = arr
  }

  at(t = 0) {
    const n = this.B.length - 1

    const B_t = v3(null, null, null)

    let basis = 0,
      bc = 0
    for (let i = 0; i <= n; i++) {
      bc = binomialCoefficient(n, i)
      basis = bc * Math.pow(1 - t, n - i) * Math.pow(t, i)
      const B_i = this.B[i].clone()
      B_i.multiplyScalar(basis)
      B_t.add(B_i)
    }

    return B_t
  }
}

export class BezierCurve1D {
  private B: Array<number>

  constructor(points) {
    this.B = []

    if (points) {
      if (Array.isArray(points)) {
        this.B = points
      } else {
        this.B.push(points)
      }
    }
  }

  length() {
    return this.B.length
  }

  addControlPoints(...vector) {
    this.B.push(...vector)
  }

  setControlPoints(arr: Array<number>) {
    this.B = arr
  }

  at(t = 0) {
    // if (t === 0){
    //     return this.B[0]
    // }
    // if (t >= 1){
    //     return this.B[this.B.length-1];
    // }

    const n = this.B.length - 1

    let B_t = 0

    let basis = 0,
      bc = 0
    for (let i = 0; i <= n; i++) {
      bc = binomialCoefficient(n, i)
      basis = bc * Math.pow(1 - t, n - i) * Math.pow(t, i)
      const B_i = this.B[i] * basis
      B_t = B_t + B_i
    }

    return B_t
  }

  getPoints(n = 2) {
    const pts = linspace(0, 1, n)

    return pts.map((t) => this.at(t))
  }
}

export const Eazier = (points: Array<number>, n: number) => {
  return new BezierCurve1D(points).getPoints(n)
}

export class EndpointInterpolator {
  private halfStep: number
  private _leg1: THREE.Vector3
  private _leg2: THREE.Vector3
  private _leg3: THREE.Vector3
  private _leg4: THREE.Vector3
  private _leg5: THREE.Vector3
  private _leg6: THREE.Vector3

  public t_off: number

  constructor() {
    this.t_off = 0
    this.halfStep = 0.735
  }

  getStride() {
    return this.halfStep * 2
  }

  setStride(value) {
    this.halfStep = value / 2
  }

  get span() {
    return (this.halfStep * 2) / Math.tan(Math.PI / 3)
  }

  getEndpoints() {
    return [this._leg2, this._leg3, this._leg4, this._leg5, this._leg6, this._leg1]
  }

  leg1(t = 0, z = 0) {
    t = (1 - t + 0.5) / 2
    this._leg1 = this.L5(t, this.span, z)
    return this
  }

  leg2(t = 0, z = 0) {
    t = (1 - t + 0.5) / 2

    this._leg2 = this.L0(t, this.span, z)
    return this
  }

  leg3(t = 0, z = 0) {
    t = (1 - t + 0.5) / 2

    this._leg3 = this.L1(t, this.span, z)
    return this
  }

  leg4(t = 0, z = 0) {
    t = (1 - t + 0.5) / 2

    this._leg4 = this.L2(t, this.span, z)
    return this
  }

  leg5(t = 0, z = 0) {
    t = (1 - t + 0.5) / 2

    this._leg5 = this.L3(t, this.span, z)
    return this
  }

  leg6(t = 0, z = 0) {
    t = (1 - t + 0.5) / 2

    this._leg6 = this.L4(t, this.span, z)
    return this
  }

  L0(t = 0, span, z = 0) {
    const start = new THREE.Vector3(span, -this.halfStep, z)
    const end = new THREE.Vector3(span, this.halfStep, z)

    const line = new THREE.Line3(start, end)

    const position = new THREE.Vector3()

    line.at(t, position)

    return position
  }

  L1(t = 0, span, z = 0) {
    const X = span * Math.sin(Math.PI / 6)
    const Y = -span * Math.cos(Math.PI / 6)

    const start = new THREE.Vector3(X, Y, z)
    const end = new THREE.Vector3(span / Math.cos(Math.PI / 3), 0, z)

    const line = new THREE.Line3(start, end)

    const position = new THREE.Vector3()

    line.at(t, position)

    return position
  }

  L2(t = 0, span, z = 0) {
    const X = span * Math.sin(Math.PI / 6)
    const Y = span * Math.cos(Math.PI / 6)

    const start = new THREE.Vector3(X, Y, z)
    const end = new THREE.Vector3(span / Math.cos(Math.PI / 3), 0, z)

    const line = new THREE.Line3(start, end)

    const position = new THREE.Vector3()

    line.at(t, position)

    return position
  }

  L3(t = 0, span, z = 0) {
    const start = new THREE.Vector3(span, this.halfStep, z)
    const end = new THREE.Vector3(span, -this.halfStep, z)

    const line = new THREE.Line3(start, end)

    const position = new THREE.Vector3()

    line.at(t, position)

    return position
  }

  L4(t = 0, span, z = 0) {
    const X = span * Math.sin(Math.PI / 6)
    const Y = -span * Math.cos(Math.PI / 6)

    const start = new THREE.Vector3(span / Math.cos(Math.PI / 3), 0, z)
    const end = new THREE.Vector3(X, Y, z)

    const line = new THREE.Line3(start, end)

    const position = new THREE.Vector3()

    line.at(t, position)

    return position
  }

  L5(t = 0, span, z = 0) {
    const X = span * Math.sin(Math.PI / 6)
    const Y = span * Math.cos(Math.PI / 6)

    const end = new THREE.Vector3(X, Y, z)
    const start = new THREE.Vector3(span / Math.cos(Math.PI / 3), 0, z)

    const line = new THREE.Line3(start, end)

    const position = new THREE.Vector3()

    line.at(t, position)

    return position
  }
}

export class Animation {
  private curves: Map<string, THREE.CatmullRomCurve3 | THREE.CatmullRomCurve3[]>
  private _timescale: number
  private _iterations: number
  private _direction: "normal" | "reverse" | "alternate" | "alternate-reverse"
  private _duration: number
  private _easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  public _promise: {
    resolve: (value?: unknown) => void
    reject: (reason?: unknown) => void
    promise: Promise<unknown>
  } | null

  constructor(keypoints: Record<string, unknown>) {
    this._timescale = 1
    this._iterations = 0
    this._direction = "normal"
    this._duration = 1
    this._easing = "ease-in-out"
    this._promise = null
    this.curves = new Map()

    for (const [property, points] of Object.entries(keypoints)) {
      // console.log({ property: property, points: points });
      if (property !== "endpoints") {
        const typedPoints = points as number[]
        const curve = new THREE.CatmullRomCurve3(typedPoints.map((point) => new THREE.Vector3(point, point, point)))

        curve.curveType = "catmullrom"

        this.curves.set(property, curve)
      } else {
        const endpointGroups = points as THREE.Vector3[][]
        const endpointCurves: THREE.CatmullRomCurve3[] = []

        for (let i = 0; i < 6; i++) {
          const legPoints = endpointGroups.map((endpointGroup) => endpointGroup[i])
          endpointCurves.push(new THREE.CatmullRomCurve3(legPoints))
        }
        this.curves.set("endpoints", endpointCurves)
      }
    }
  }

  setTimescale(value: number) {
    this._timescale = value
    return this
  }

  getTimescale() {
    return this._timescale
  }

  setIterations(value: number) {
    this._iterations = value
    return this
  }

  getIterations() {
    return this._iterations
  }

  setDirection(value: "normal" | "reverse" | "alternate" | "alternate-reverse") {
    this._direction = value
    return this
  }

  getDirection() {
    return this._direction
  }

  setDuration(value: number) {
    this._duration = value
    return this
  }

  getDuration() {
    return this._duration
  }

  setEasing(value: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out") {
    this._easing = value
    return this
  }

  ease(t: number) {
    switch (this._easing) {
      case "linear":
        return t
      case "ease": {
        // Using variables outside case block to avoid 'Unexpected lexical declaration in case block'
        // const p0 = 0;   // Start point (not used)
        const p1 = 0.25 // Control point 1 (x)
        const p2 = 0.25 // Control point 2 (y)
        const p3 = 1 // End point

        // Cubic bezier interpolation formula
        return 3 * Math.pow(1 - t, 2) * t * p1 + 3 * (1 - t) * Math.pow(t, 2) * p2 + Math.pow(t, 3) * p3
      }
      case "ease-in":
        return t * t
      case "ease-out":
        return t * (2 - t)
      case "ease-in-out":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      default:
        return t
    }
  }

  at(t: number, property: string) {
    t = tClamp(this.ease(t))

    if (!this.curves.has(property)) return null

    if (property !== "endpoints") {
      const curve = this.curves.get(property) as THREE.CatmullRomCurve3
      return curve.getPoint(t).x
    }

    const endpointCurves = this.curves.get("endpoints") as THREE.CatmullRomCurve3[]
    const endpoints = endpointCurves.map((endpointCurve) => endpointCurve.getPoint(t))

    return endpoints
  }
}

export class Animator {
  private hexapod: Hexapod
  private model: Model
  private animationQueue: Array<Animation>
  private timer: Timer
  private t: number
  private currentAnimation: null | Animation
  private reverse: boolean

  constructor(hexapod: Hexapod, model: Model) {
    this.hexapod = hexapod
    this.model = model
    this.animationQueue = []
    this.timer = new Timer()
    this.t = 0
    this.currentAnimation = null
    this.reverse = false
  }

  queueAnimation(animation: Animation) {
    // Using a custom promise resolver since Promise.withResolvers() is not widely supported
    const resolver: {
      resolve: (value?: unknown) => void
      reject: (reason?: unknown) => void
      promise: Promise<unknown>
    } = {} as {
      resolve: (value?: unknown) => void
      reject: (reason?: unknown) => void
      promise: Promise<unknown>
    }

    resolver.promise = new Promise((resolve, reject) => {
      resolver.resolve = resolve
      resolver.reject = reject
    })

    animation._promise = resolver

    this.animationQueue.push(animation)

    return animation._promise.promise
  }

  step() {
    if (this.currentAnimation === null) {
      if (this.animationQueue.length === 0) {
        return
      }

      this.currentAnimation = this.animationQueue.shift() as Animation

      switch (this.currentAnimation.getDirection()) {
        case "normal":
          this.reverse = false
          break
        case "alternate":
          this.reverse = false
          break

        case "reverse":
          this.reverse = true
          break

        case "alternate-reverse":
          this.reverse = true
          break

        default:
          this.reverse = false
      }

      this.t = 0

      this.timer = new Timer()
    }

    const anim = this.currentAnimation as Animation

    if (this.t > 1) {
      if (anim.getIterations() === 0) {
        this.currentAnimation._promise?.resolve()
        this.currentAnimation = null

        return
      } else {
        anim.setIterations(anim.getIterations() - 1)

        if (anim.getDirection() === "alternate" || anim.getDirection() === "alternate-reverse") {
          this.reverse = !this.reverse
        }

        this.t = 0

        this.timer = new Timer()
      }
    }

    // console.log('t = ', this.t);

    // const anim = this.currentAnimation as Animation;
    let t = this.t

    if (t === 0) {
      t = t + 0.01
    }

    if (anim.getDirection() === "reverse") {
      t = 1 - t
    } else if (anim.getDirection() === "alternate" && this.reverse) {
      console.log("reverse = ", this.reverse)
      t = 1 - t
    }

    // t = easeInOut(t)

    const currentPose = this.model.pose

    // console.log("roll", almostEqual(anim.at(t, 'roll'), currentPose.roll))
    const samePose =
      almostEqual(anim.at(1, "x"), currentPose.x) &&
      almostEqual(anim.at(1, "y"), currentPose.y) &&
      almostEqual(anim.at(1, "z"), currentPose.z) &&
      almostEqual(anim.at(1, "roll"), currentPose.roll) &&
      almostEqual(anim.at(1, "pitch"), currentPose.pitch) &&
      almostEqual(anim.at(1, "yaw"), currentPose.yaw)

    // console.log("samePose = ", samePose)

    if (samePose) {
      this.currentAnimation?._promise?.resolve()
      this.currentAnimation = null
      return
    }

    // Ensure we get numbers for the pose properties
    const xValue = anim.at(t, "x")
    const yValue = anim.at(t, "y")
    const zValue = anim.at(t, "z")
    const rollValue = anim.at(t, "roll")
    const pitchValue = anim.at(t, "pitch")
    const yawValue = anim.at(t, "yaw")

    const newPose = {
      x: typeof xValue === "number" ? xValue : currentPose.x,
      y: typeof yValue === "number" ? yValue : currentPose.y,
      z: typeof zValue === "number" ? zValue : currentPose.z,
      roll: typeof rollValue === "number" ? rollValue : currentPose.roll,
      pitch: typeof pitchValue === "number" ? pitchValue : currentPose.pitch,
      yaw: typeof yawValue === "number" ? yawValue : currentPose.yaw,
    }

    const currEndpoints = this.model.endpoints

    const endpointValue = anim.at(t, "endpoints")
    const newEndpoints = Array.isArray(endpointValue) ? endpointValue : currEndpoints

    this.hexapod.updateBodyIK(newPose, newEndpoints)

    this.timer.update()

    this.t = this.timer.getElapsed() / anim.getDuration()

    // if (!success) {
    // this.currentAnimation._promise.reject()
    // this.currentAnimation = null;
    // }
  }
}

const almostEqual = (a: number | null | unknown, b: number | null | unknown) => {
  if (a === null) return true
  if (typeof a === "number" && typeof b === "number") {
    return a.toFixed(4) === b.toFixed(4)
  }
  return false
}
