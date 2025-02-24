# Interactive Hexapod Solver

<p align="center">
<a href="https://hexapod-simulator.onrender.com/"><b>Try it out here!</b></a>
</p>

<img style="border-radius:12px" src="demo.gif"/>

## Details

The 3D visualization is powered by the three.js library. The inverse kinematics calculations use trigonometry for a closed-form solution, while forward kinematics leverage Denavit–Hartenberg parameters. Animations are achieved using Catmull-Rom (centripetal) splines for interpolation and Bézier curves for easing.

I am still in the process of commenting and refactoring the code. Feel free to report any issues you face!

## Running Locally

First make sure you have Node.js and npm installed!

```bash
git clone https://github.com/mut-ex/hexapod-simulator.git
cd hexapod-simulator
npm install
npm run dev
```

Then open `http://localhost:5173/` in your browser.
