import * as THREE from "three";
import { MeshLineGeometry, MeshLineMaterial, raycast } from "meshline";

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message ? message : "Assertion failed");
  }
}

export function numberToHexString(number) {
  return (number & 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
}

export function V3(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

export function rotateLeft(array) {
  const last = array[array.length - 1];
  return [last, ...array.slice(0, -1)];
}

export function deg2rad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function rad2deg(radians) {
  return (radians * 180) / Math.PI;
}

export function sampleCircle({ radius, interval, offset = 0, z = 0 }) {
  let x, y;
  let points = [];
  for (let theta = 0; theta < 360; theta += interval) {
    x = radius * cos(offset + theta);
    y = radius * sin(offset + theta);
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

export function acos(x) {
  return rad2deg(Math.acos(x));
}

export function atan2(x, y) {
  return rad2deg(Math.atan2(x, y));
}

export function sin(x) {
  return Math.sin((x * Math.PI) / 180);
}

export function cos(x) {
  return Math.cos((x * Math.PI) / 180);
}

export function sqrt(x) {
  return Math.sqrt(x);
}

export function sq(x) {
  return Math.pow(x, 2);
}

export function createCylinderAligned({
  points,
  radiusTop,
  radiusBottom,
  color = "white",
  radialSegments = 32,
}) {
  // Compute the midpoint for positioning
  const midpoint = new THREE.Vector3().lerpVectors(points[0], points[1], 0.5);

  // Compute the direction vector and its length
  const direction = new THREE.Vector3().subVectors(points[1], points[0]);

  const length = direction.length();

  // Create a cylinder geometry
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    length,
    radialSegments
  );

  // Create a material and mesh
  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    iridescence: 1,
  });

  // Create the cylinder mesh
  const cylinder = new THREE.Mesh(geometry, material);

  // Align the cylinder with the direction vector
  const quaternion = new THREE.Quaternion();

  // Create the quaternion to rotate from direction vector vFrom to vTo
  const vFrom = new THREE.Vector3(0, 1, 0);
  const vTo = direction.clone().normalize();
  quaternion.setFromUnitVectors(vFrom, vTo);

  // Move the cylinder's center to the midpoint of the line, then rotate it to align with the line.
  cylinder.position.copy(midpoint);
  cylinder.setRotationFromQuaternion(quaternion);

  cylinder.receiveShadow = true;
  cylinder.castShadow = true;

  return cylinder;
}

export function createLine(points, color) {
  const material = new THREE.LineBasicMaterial({
    color: color,
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setFromPoints(points);

  const mesh = new THREE.Line(geometry, material);

  return mesh;
}

export function createSphere({
  radius = 0.01,
  color = "white",
  horizontalSegments = 32,
  verticalSegments = 32,
  wireframe = false,
  transparent = false,
  opacity = 1,
}) {
  const geometry = new THREE.SphereGeometry(
    radius,
    horizontalSegments,
    verticalSegments
  );
  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    wireframe: wireframe,
    transparent: transparent,
    opacity: opacity,
    iridescence: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.receiveShadow = true;
  mesh.castShadow = true;

  return mesh;
}

export function createMeshLine(points, thickness, color) {
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

function cubicBezier(t, x1, y1, x2, y2) {
  function bezier(t, p0, p1, p2, p3) {
    return (
      (1 - t) ** 3 * p0 +
      3 * (1 - t) ** 2 * t * p1 +
      3 * (1 - t) * t ** 2 * p2 +
      t ** 3 * p3
    );
  }

  function bezierDerivative(t, p0, p1, p2, p3) {
    return (
      3 * (1 - t) ** 2 * (p1 - p0) +
      6 * (1 - t) * t * (p2 - p1) +
      3 * t ** 2 * (p3 - p2)
    );
  }

  // We need to solve for x where Bezier_x(t) = t
  let x = t;
  for (let i = 0; i < 5; i++) {
    // Newton's method for better accuracy
    let xEstimate = bezier(x, 0, x1, x2, 1);
    let dx = bezierDerivative(x, 0, x1, x2, 1);
    if (Math.abs(xEstimate - t) < 1e-6) break;
    x -= (xEstimate - t) / dx;
  }

  // Use the solved x to find y
  return bezier(x, 0, y1, y2, 1);
}

// Predefined ease-in-out function
export function easeInOutCubic(t) {
  return cubicBezier(t, 0.17, 0.67, 0.83, 0.67);
}

// export function createSphere(radius, color) {
//   const geometry = new THREE.SphereGeometry(radius, 12, 12);
//   const material = new THREE.MeshMatcapMaterial({
//     color: color,
//     wireframe: false,
//     transparent: true,
//     opacity: 1,
//   });
//   return new THREE.Mesh(geometry, material);
// }
