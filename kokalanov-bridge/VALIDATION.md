# v1.0 verification — 10 November 2026

## Numerical engine

10 automated analytic/physics checks passed: exact axial bar, exact symmetric triangle, mass and support reactions, energy/stiffness/load scaling, singular mechanism, off-node vehicle equilibrium, all three topologies, first-mode eigen residual, real inspection pass/fail, free decay and input sanitisation.

48 additional extreme-geometry/material cases were evaluated across Warren/Pratt/Howe, span 12/50 m, height 2/10 m, panels 4/12, bar diameter 50/200 mm, 600 kN vehicle and 100 kN in-plane load. All produced finite stable results. Largest first-mode relative eigen residual: 6.65e-10. Capacity failures and linear-range exceedance remain visible failures, not hidden numerical errors.

Default Warren, 30 m span, 5 m height, 85 mm bars and 180 kN vehicle at midspan:
- Normal: 9.5953 mm static vertical deflection; 92.1601% maximum utilisation.
- Kokalanov: 160.4138% maximum utilisation; inspection fails.
- Increasing bars to 110 mm reduces strict utilisation to 63.5287%; inspection passes.

## Browser interaction checks

- Turkish, English and Macedonian interfaces were exercised.
- A 375 CSS-pixel content viewport in a 390-pixel phone frame had no horizontal overflow; Macedonian copy and controls remained readable.
- The vehicle crossing progressed to 100% and returned to the stopped state.
- A new diagonal was added using the 3D joint picker; displacement, mass and utilisation changed accordingly.
- Removing a stabilising member produced the unstable banner, blank numeric outputs and disabled crossing/vibration controls. Reset restored the stable model.
- Thin and reinforced designs produced actual different strict-inspection outcomes.
- Two designs were saved and compared, with different mass, displacement and frequency results.
- PNG, CSV and source ZIP downloads produced real browser download events.
- The printable report opened and displayed the computed member forces, stresses, parameters and equilibrium residual.
- The free-vibration test produced a dense response path in the SVG graph.

## Verification limits

The QA browser has WebGL disabled. The automatic Canvas perspective renderer, its 3D selection/editing, camera controls and image capture were visually/behaviourally verified. The WebGL renderer has syntax checks but could not be rendered in this environment. Phone layout was tested using an actual narrow iframe viewport, not a physical Android/iPhone.

The simulation is the declared ideal linear planar model in METHODS.md, with a single-mode free-decay experiment. It is not an engineering safety assessment or full nonlinear/spatial dynamic simulation. Saved designs use browser-local storage, not a cloud account.
