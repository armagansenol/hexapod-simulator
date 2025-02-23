import * as THREE from "three";

export const enum Events {
  SliderInput = "slider-input",
  UpdateHexapod = "update-hexapod",
  BodySliderUpdate = "body-slider-input",
  JointsSliderUpdate = "joints-slider-input",
  EndpointsSliderUpdate = "endpoints-slider-input",
  SliderValuesChanged = "slider-values-changed",
  TabSwitched = "tab-switched",
  LegSelectionChanged = "leg-selection-changed",
  JointAngleChanged = "joint-angle-changed",
  EndpointPositionChanged = "endpoint-position-changed",

  HexapodAnimationStarted = "animation-started",
  HexapodAnimationFinished= "animation-finished",
  HexapodAnimationStopped = "animation-stopped",

  HexapodPoseUpdate = "hexapod-pose-update",
  HexapodJointAnglesUpdate = "hexapod-joint-angles-update",
  HexapodEndpointPositionsUpdate = "hexapod-endpoint-positions-update"
}

// enum Categories {
//   Body = "body",
//   Joints = "joints",
//   Endpoints = "endpoints",
// }
export interface Animation {
  id?: null | number;
  timescale?: null | number;
  poseInitial?: null | Pose | Partial<Pose>;
  poseFinal?: null | Pose | Partial<Pose>;
  endpointsInitial?:null | Array<THREE.Vector3>;
  endpointsFinal?:null | Array<THREE.Vector3>;
};

export type Source = "user" | "hexapod";

export type Category = "body" | "joints" | "endpoints";

export type Parameter =
  | "x"
  | "y"
  | "z"
  | "roll"
  | "pitch"
  | "yaw"
  | "alpha"
  | "beta"
  | "gamma";

export type Pose = {
  x: number;
  y: number;
  z: number;
  roll: number;
  pitch: number;
  yaw: number;
};

export type JointAngles = {
  gamma: number;
  beta: number;
  alpha: number;
};
