let lightMode = false;

interface Camera {
  fov: number;
  position: [number, number, number];
  near: number;
  far: 1000;
  aspect: number,
}

interface AmbientLight {
  color: number;
  intensity: number;
  shadow: {
    cast: boolean
  }
}

interface DirectionalLight {
  color: number;
  intensity: number;
  position: [number, number, number];
  shadow: {
    cast: boolean,
    mapSizeWidth: number,
    mapSizeHeight: number,
    cameraNear: number,
    cameraFar: number
  }
}

interface OrbitControls {
  autoRotate: boolean;
  enableDamping: boolean;
  dampingFactor: number;
}

interface Hexapod {
  body: {
    color: number,
    height: number,
    radius: number,
    // thickness: number,
    scale: { x: number, y: number, z: number },
  };
  coxa: {
    scale: { x: number, y: number, z: number },
    length: number,
    color: string,
    thickness: number,
    radius: number,
  };
  femur: {
    color: string,
    length: number,
    radiusBottom: number,
    radiusTop: number,
    thickness: number,
  };
  colorKnee: string;
  tibia: {
    color: string,
    length: number,
    radiusBottom: number,
    radiusTop: number,
    thickness: number,
  };
};

interface Configuration {
  colorBackground: number;
  colorFloorPlane: number;
  sizeFloorPlane: [number, number]
  camera: Camera;
  shadows: boolean;
  lights: { ambient: AmbientLight, directional: DirectionalLight };
  orbitControls: OrbitControls;
  hexapod: Hexapod;
}


export const config: Configuration = {
  colorBackground: lightMode ? 0xbde0fe : 0x212529,
  colorFloorPlane: lightMode ? 0xbde0fe : 0x212529,
  sizeFloorPlane: [3.5, 3.5],
  camera: {
    fov: 40,
    position: [0, -3.5, 3.5],
    // position: [4, 0, 3],
    near: 0.1,
    far: 1000,
    aspect: window.innerWidth / window.innerHeight,
  },
  shadows: true,
  lights: {
    ambient: {
      color: 0xffffff,
      intensity: 0.5,
      shadow: { cast: true },
    },
    directional: {
      color: 0xffffff,
      intensity: 2,
      position: [3, 3, 10],
      shadow: {
        cast: true,
        mapSizeWidth: 1024,
        mapSizeHeight: 1024,
        cameraNear: 0.1,
        cameraFar: 1000,
      }
    }
  },
  orbitControls: {
    autoRotate: false,
    enableDamping: true,
    dampingFactor: 0.1
  },
  hexapod: {
    body: {
      color: lightMode ? 0x7ae582 : 0x7ae582,
      height: 0.17,
      // height: 0.5,
      radius: 0.5,
      scale: { x: 1, y: 1, z: 0.5 },
    },
    coxa: {
      scale: { x: 1, y: 1, z: 0 },
      length: 0,
      color: lightMode ? "#7ae582" : "#7ae582",
      thickness: 0.125,
      radius: 0.1,
    },
    femur: {
      color: lightMode ? "#7ae582" : "#7ae582",
      length: 0.5,
      radiusBottom: 0.1,
      radiusTop: 0.06,
      thickness: 0.05,
    },
    colorKnee: lightMode ? "#7678ed" : "#7678ed",
    tibia: {
      color: lightMode ? "#7678ed" : "#7678ed",
      length: 0.7,
      radiusBottom: 0.06,
      radiusTop: 0.01,
      thickness: 0.05,
    },
  }
};

