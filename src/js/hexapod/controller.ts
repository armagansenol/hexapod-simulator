import * as THREE from 'three';
import { config } from '../configuration';
import {
  deg2rad,
  rad2deg,
  sampleCircle,
  sq,
  sqrt,
  V3,
  createCylinderAligned,
  createLine,
  assert,
} from '../utils';
import { Hexapod } from './body';
import {
  EndpointInterpolator,
  Animator,
  Bezier,
  Eazier,
  Animation,
} from './animation';
import {
  Events,
  JointAngles,
  Pose,
  Source,
  Category,
  Parameter,
} from './common';
import { View } from './view';
import { Model } from './model';

export class HexapodController {
  public scene: THREE.Scene;

  private hexapod: Hexapod;
  private model: Model;
  private view: View;
  private animator: Animator;

  constructor(scene: THREE.Scene) {
    // Create instances of the hexapod, model, and view
    this.hexapod = new Hexapod(scene);
    this.model = new Model();

    this.hexapod.setModel(this.model);

    this.view = new View();

    // Register view event listeners
    this.addViewEventListeners();

    // Register hexapod event listeners
    this.addHexapodEventListeners();

    // Set the initial category of the tabbed view
    this.view.setTab('body');

    this.hexapod.updateBodyIK(
      this.model.pose,
      this.model.endpoints,
    );

    // const interpolator = new EndpointInterpolator();

    const animator = new Animator(this.hexapod, this.model);
    this.animator = animator;

    // Disable all sliders, play the intro animation then enable the sliders again.
    this.disableAllSliders();
    this.hexapodStand().then(() =>
      this.hexapodWiggle
        .bind(this, 10)()
        .then(this.enableAllSliders.bind(this)),
    );
  }

  hexapodStand() {
    return this.animator.queueAnimation(
      new Animation({
        z: Eazier([0.17, 0.4, 1, 0.3], 8),
      })
        .setDuration(0.8)
        .setEasing('ease-out'),
    );
  }

  hexapodWiggle(angle = 10) {
    const tilt = deg2rad(angle);
    const pose = this.model.pose;

    this.animator.queueAnimation(
      new Animation({
        x: [pose.x, 0],
        y: [pose.y, 0],
        z: [pose.z, 0.3],
        roll: [pose.roll, 0],
        pitch: [pose.pitch, 0],
        yaw: [pose.yaw, 0],
      }).setDuration(0.1),
    );

    return this.animator.queueAnimation(
      new Animation({
        z: [0.3, 0.6, 0.3, 0.4],
        roll: [
          0,
          tilt,
          tilt,
          0,
          -tilt,
          -tilt,
          -tilt,
          0,
          tilt,
          tilt,

          tilt,
          0,
          -tilt,
          -tilt,
          -tilt,
          0,
          tilt,
          tilt,
          0,
        ],
        pitch: [
          0,
          0,
          tilt,
          tilt,
          tilt,
          0,
          -tilt,
          -tilt,
          -tilt,
          0,

          tilt,
          tilt,
          tilt,
          0,
          -tilt,
          -tilt,
          -tilt,
          0,
          0,
        ],
        // z: Eazier([0.17, 0.5, 1, 0.5], 8),
      })
        .setDirection('normal')
        .setDuration(2.5)
        .setEasing('ease-in-out'),
    );
  }

  /**
   * Adds event listeners to the View instance
   */
  addViewEventListeners() {
    // Handle the switching of tabs
    this.view.addEventListener(
      Events.TabSwitched,
      (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        console.log('Controller, tab switched; ', detail);

        let category = this.model.getCategory();

        // Disable the sliders when leaving joints or
        // endpoints tabs
        if (
          category === 'joints' ||
          category === 'endpoints'
        ) {
          this.view.disableSliders(category);
        }

        let newCategory = detail.value;

        this.model.setCategory(newCategory);

        // Disable the sliders if moving to the joints or endpoints tab
        if (
          newCategory === 'joints' ||
          newCategory === 'endpoints'
        ) {
          this.view.disableSliders(newCategory);
        }
      },
    );

    // Update the model when the leg selection changes,
    // and update the sliders accordingly
    this.view.addEventListener(
      Events.LegSelectionChanged,
      (event: Event) => {
        const detail = (<CustomEvent>event).detail;

        this.model.setSelectedLegIndexes(detail.value);

        let category = this.model.getCategory();

        if (category === 'joints') {
          const { gamma, beta, alpha } =
            this.model.joints[
            this.model.getSelectedLegIndexes()[0]
            ];
          console.log(gamma, beta, alpha);
          this.view.setSliderValue(
            category,
            'gamma',
            String(gamma),
          );
          this.view.setSliderValue(
            category,
            'beta',
            String(beta),
          );
          this.view.setSliderValue(
            category,
            'alpha',
            String(alpha),
          );
        } else if (category === 'endpoints') {
          const { x, y, z } =
            this.model.endpoints[
            this.model.getSelectedLegIndexes()[0]
            ];
          console.log(x, y, z);
          this.view.setSliderValue(
            category,
            'x',
            String(x),
          );
          this.view.setSliderValue(
            category,
            'y',
            String(y),
          );
          this.view.setSliderValue(
            category,
            'z',
            String(z),
          );
        }
        this.view.enableSliders(this.model.getCategory());
      },
    );

    // Handle the slider input
    this.view.addEventListener(
      Events.SliderInput,
      this.handleSliderInput.bind(this),
    );
  }

  /**
   * Adds event listeners to the Hexapod instance
   */
  addHexapodEventListeners() {
    // Update the model and input sliders when the body's
    // pose changes
    this.hexapod.addEventListener(
      Events.HexapodPoseUpdate,
      (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        const pose = detail.pose;

        this.model.pose.x = pose.x;
        this.model.pose.y = pose.y;
        this.model.pose.z = pose.z;
        this.model.pose.roll = pose.roll;
        this.model.pose.pitch = pose.pitch;
        this.model.pose.yaw = pose.yaw;

        this.view.setSliderValue('body', 'x', pose.x);
        this.view.setSliderValue('body', 'y', pose.y);
        this.view.setSliderValue('body', 'z', pose.z);
        this.view.setSliderValue('body', 'roll', pose.roll);
        this.view.setSliderValue(
          'body',
          'pitch',
          pose.pitch,
        );
        this.view.setSliderValue('body', 'yaw', pose.yaw);
      },
    );

    // Update the model and the view when the leg angles
    // change
    this.hexapod.addEventListener(
      Events.HexapodJointAnglesUpdate,
      (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        const jointAngles = detail.jointAngles;

        // Update the model
        this.model.setJoints(jointAngles);

        let indexes = this.model.getSelectedLegIndexes();

        let index = 0;

        // Update the view
        if (indexes.length > 0) {
          index = indexes[0];

          const legJointAngles = this.model.joints[index];

          this.view.setSliderValue(
            'joints',
            'gamma',
            String(legJointAngles.gamma),
          );
          this.view.setSliderValue(
            'joints',
            'beta',
            String(legJointAngles.beta),
          );
          this.view.setSliderValue(
            'joints',
            'alpha',
            String(legJointAngles.alpha),
          );
        }
      },
    );

    // Update the model and the view when the leg endpoint
    // positions change
    this.hexapod.addEventListener(
      Events.HexapodEndpointPositionsUpdate,
      (event: Event) => {
        const detail = (<CustomEvent>event).detail;
        const endpoints = detail.endpoints;
        // console.log("endpoints[1] = ", endpoints[1]);
        // Update the model
        this.model.setEndpoints(endpoints);

        let indexes = this.model.getSelectedLegIndexes();

        let index = 0;

        // Update the view
        if (indexes.length > 0) {
          index = indexes[0];

          const endpoint = this.model.endpoints[index];

          this.view.setSliderValue(
            'endpoints',
            'x',
            String(endpoint.x),
          );
          this.view.setSliderValue(
            'endpoints',
            'y',
            String(endpoint.y),
          );
          this.view.setSliderValue(
            'endpoints',
            'z',
            String(endpoint.z),
          );
        }
      },
    );

    // Disable input sliders when an animation is running
    this.hexapod.addEventListener(
      Events.HexapodAnimationStarted,
      this.disableAllSliders.bind(this),
    );

    // Enable input sliders when an animation completes
    this.hexapod.addEventListener(
      Events.HexapodAnimationFinished,
      this.enableAllSliders.bind(this),
    );

    // Enable input sliders when an animation is terminated
    this.hexapod.addEventListener(
      Events.HexapodAnimationStopped,
      this.enableAllSliders.bind(this),
    );
  }

  disableAllSliders() {
    this.view.disableSliders('body');
    this.view.disableSliders('joints');
    this.view.disableSliders('endpoints');
  }

  enableAllSliders() {
    this.view.enableSliders('body');
    this.view.enableSliders('joints');
    this.view.enableSliders('endpoints');
  }

  animate() {
    this.animator.step();
  }

  handleSliderInput(event: Event) {
    const detail = (<CustomEvent>event).detail;

    // Disable the event listener on sliders while we update the hexapod.
    this.view.disableSliderInputHandler();
    /*
    type Source = "user" | "hexapod";
    type Category = "body" | "joints" | "endpoints";
    type Parameter = "x" | "y" | "z" | "roll" | "pitch" | "yaw" | "alpha" | "beta" | "gamma";
    */
    const source = detail.source as Source;
    const category = detail.category as Category;
    const parameter = detail.parameter as Parameter;
    const value = detail.value as number;

    if (category === 'body') {
      this.updateBody(source, category, parameter, value);
    } else if (category === 'joints') {
      this.updateJoint(source, category, parameter, value);
    } else if (category === 'endpoints') {
      this.updateEndpoint(
        source,
        category,
        parameter,
        value,
      );
    }

    // Resume event listening on the sliders.
    this.view.enableSliderInputHandler();
  }

  updateBody(
    source: Source,
    category: Category,
    parameter: Parameter,
    value: number,
  ) {
    const oldPose = this.model.pose;
    const endpoints = this.model.endpoints;

    const newPose = {
      x: oldPose.x,
      y: oldPose.y,
      z: oldPose.z,
      roll: oldPose.roll,
      pitch: oldPose.pitch,
      yaw: oldPose.yaw,
    };

    newPose[parameter] = value;

    const success = this.hexapod.updateBodyIK(
      newPose,
      endpoints,
    );

    // If the update was a success update the model,
    // otherwise discard the new pose and revert the slider.
    if (success) {
      this.model.pose = newPose;
    } else {
      console.log('Body IK failure!');
      this.view.setSliderValue(
        category,
        parameter,
        oldPose[parameter],
      );
    }
  }

  updateJoint(
    source: Source,
    category: Category,
    parameter: Parameter,
    value: number,
  ) {
    const pose = this.model.pose;

    const oldJointAngles = this.model.joints;

    const newJointAngles = oldJointAngles.map((obj) => ({
      ...obj,
    }));

    const indexes = this.model.getSelectedLegIndexes();

    for (let i = 0; i < 6; i++) {
      if (indexes.includes(i)) {
        newJointAngles[i][parameter] = value;
      }
    }

    const result = this.hexapod.updateBodyFK(
      pose,
      newJointAngles,
    );

    if (result) {
      // this.model.jointAngles = newJointAngles;
      // this.model.endpoints.forEach((endpoint, index) => {
      //   endpoint.copy(result[index]);
      // });
    } else {
      // this.view.blurSliders("joints")
      this.view.setSliderValue(
        category,
        parameter,
        oldJointAngles[indexes[0]][parameter],
      );
    }
  }

  updateEndpoint(
    source: Source,
    category: Category,
    parameter: Parameter,
    value: number,
  ) {
    const pose = this.model.pose;

    const oldEndpoints = this.model.endpoints;

    const newEndpoints = this.model.endpoints.map(
      (endPoint) => endPoint.clone(),
    );

    const indexes = this.model.getSelectedLegIndexes();

    for (let i = 0; i < 6; i++) {
      if (indexes.includes(i)) {
        newEndpoints[i][parameter] = value;
      }
    }

    const result = this.hexapod.updateBodyIK(
      pose,
      newEndpoints,
    );

    if (result) {
      // this.model.jointAngles = newJointAngles;
      // this.model.endpoints.forEach((endpoint, index) => {
      // endpoint.copy(result[index]);
      // });
    } else {
      // this.view.blurSliders("joints")
      this.view.setSliderValue(
        category,
        parameter,
        oldEndpoints[indexes[0]][parameter],
      );
    }
  }
}
