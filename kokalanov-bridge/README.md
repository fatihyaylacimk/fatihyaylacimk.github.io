# Kokalanov Bridge Lab

Interactive 3D bridge experiment, developed by Fatih for Vasko Kokalanov.

## Live website

https://fatihyaylacimk.github.io/kokalanov-bridge/

Turkish, English and Macedonian are available in the language selector. The Macedonian view can also be opened with `?lang=mk`.

## Run locally

Serve this directory with `python -m http.server 8080`, then open http://localhost:8080/. All runtime assets are included; there are no API keys, CDN dependencies or login requirements.

Run numerical verification with `node --test tests/*.test.mjs`. Download `Kokalanov_Bridge_Lab_v1.zip` for the original standalone package with its Windows launcher and full source layout.

## Model

See METHODS.md for the actual planar truss FEM, modal model, declared assumptions and limits. The fictional inspection has transparent thresholds and can be passed by a sufficiently strong design. The humorous comments are original fictional copy, not quotations or official university assessment.

## Storage

Saved designs are local to each browser. Import/export JSON to transfer them.

## Dependencies

Three.js 0.180.0 is vendored locally under its MIT license. A Canvas perspective renderer provides the interactive 3D view when WebGL is unavailable.
