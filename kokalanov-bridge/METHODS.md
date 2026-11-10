# Calculation model

## Planar truss

Each visible bridge side is a pin-jointed, small-displacement planar truss. The sides are displayed at ±2.7 m but calculated as identical independent planes. A side receives half the total deck and vehicle loads, plus its own bar self-weight. This is not a spatial frame analysis.

For a bar of length L, unit direction (c,s), cross-sectional area A and Young's modulus E:

`b = [-c,-s,c,s]`

`ke = (EA/L) b bᵀ`

Assemble K, impose the actual chosen translational constraints and solve `Kff uf = Ff` by Cholesky factorisation. A non-positive or tiny scaled pivot rejects the system as unstable/ill-conditioned. No stabilising springs are silently added.

Recover `N = (EA/L) bᵀ ue`, `stress = N/A`, `reactions = Ku-F`. Positive force is tension. The export includes free-DOF residuals and support reactions. Tests independently verify energy and global equilibrium.

## Section, mass and loads

All members have a solid circular section with specified diameter d: `A=πd²/4`, `I=πd⁴/64`. Assumed elastic steel: E=200 GPa, density=7850 kg/m³, illustrative yield stress=250 MPa. These are declared model assumptions, not a certified grade.

The total deck line mass is assumed 350 kg/m, split 175 kg/m per side. Half of each member's self-weight is lumped to each endpoint. The two-side bridge mass includes two side trusses and the deck, but excludes the vehicle.

A vehicle load P between deck nodes i,j is distributed as `P(1-t)` and `Pt`. It exactly preserves the force and moment of that point load. The user-entered vehicle and horizontal load are whole-bridge totals. A horizontal load acts in the truss plane, split equally over top joints and the two sides; it is not a wind-speed or lateral stability model.

## Fictional inspection rules

| Rule | Normal | Kokalanov |
|---|---:|---:|
| Vehicle / horizontal load factor | 1.0 | 1.5 |
| Self-weight factor | 1.0 | 1.0 |
| Vertical deflection limit | L/400 | L/800 |
| Capacity margin | 1.5 | 2.0 |

Yield utilisation is `abs(stress) / (fy / margin)`. For compression only, an ideal pin-ended individual-member Euler screen uses `Pcr=π²EI/L²`, with utilisation `abs(N)/(Pcr/margin)`. This is not a global/nonlinear buckling calculation. Overall utilisation also includes static vertical deflection/limit. These are explicit fictional experiment thresholds, not a building code. A stable, in-range model passes if every utilisation is ≤1.

Displacements greater than 3% of span are marked beyond the small-displacement model's range. No actual post-buckling collapse or safety inference is made.

## Modal experiment

Bar mass is lumped to endpoint translational DOFs; deck and actual vehicle mass are added consistently. Inverse iteration solves the lowest generalised mode of `Kφ=ω²Mφ`. Reported frequency is `sqrt(lambda)/(2π)`; mode shape is normalised to unit maximum component. A generalised eigen-residual is computed and verified in tests.

The vibration button holds the vehicle position fixed and excites a 15 mm initial first-mode displacement with zero initial modal velocity, damping ratio ζ=0.02. The exact underdamped free response is:

`q(t)=A exp(-ζωt) [cos(ωd t)+(ζω/ωd)sin(ωd t)]`, where `ωd=ω sqrt(1-ζ²)`.

The vehicle crossing is a sequence of static load cases. It is not moving-vehicle dynamic integration. Neither mode is an earthquake simulation. Main displacement metrics remain static; the time chart includes the selected modal free response.

## Rendering

Ordinary displacements are multiplied by a constant 60 for legibility. Extremely large results reduce this scale to keep the scene viewable; the actual multiplier is always labelled. Numerical values, stresses, exports and reports never use that visual multiplier.

## Primary references

- Jönköping University, Applied Mechanics, Systematic truss analysis: https://mechanics.ju.se/SolidMechanics/SystematicTrussAnalysis.html
- University of Illinois, Mechanics Reference, Elastic buckling: https://mechref.engr.illinois.edu/sol/buckling.html
- MIT OpenCourseWare, Engineering Dynamics, Lecture 24, Modal analysis: https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/resources/lecture-24-modal-analysis-orthogonality-mass-stiffness-damping-matrix/

The humorous copy is fictional. The project is not an official university product or an assessment issued by Professor Kokalanov.
