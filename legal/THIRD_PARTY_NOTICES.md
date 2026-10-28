# LitSquare Stage Open-Source and Third-Party Notices

LitSquare Stage includes first-party open-source packages and third-party
software. This document is an index; the accompanying `licenses/` directory
contains the verbatim upstream license, NOTICE, and patent files used for
this release.

## Native app runtime

| Component | Version | License treatment |
|---|---:|---|
| MCP Swift SDK | 0.12.1 | Apache-2.0/MIT contribution split; both texts and the upstream explanation are included |
| EventSource | 1.4.1 | MIT |
| Swift Atomics | 1.3.1 | Apache-2.0 |
| Swift Collections | 1.6.0 | Apache-2.0 |
| Swift Log | 1.14.0 | Apache-2.0 and NOTICE |
| SwiftNIO | 2.101.3 | Apache-2.0 and NOTICE |
| Swift System | 1.7.4 | Apache-2.0 |
| libwebp | 1.6.0 | BSD-3-Clause-style WebM license and patent grant |

The SwiftNIO NOTICE is reproduced verbatim and includes upstream acknowledgments
for Netty, llhttp, uSHET, FreeBSD/WIDE SHA-1 code, Swift Base64,
AsyncHTTPClient, SwiftCertificates, Swift System, and SwiftPM-derived code.

## JavaScript runtime and shipped templates

| Component | Version | License |
|---|---:|---|
| `@litsquare/stage` | 0.1.1 | MIT; first-party |
| Paper.js | 0.12.18 | MIT |
| Three.js | 0.165.0 | MIT |
| Vite | 6.4.2 or 6.4.3 according to the applicable lockfile | MIT; build-time |
| TypeScript | 5.9.3 | Apache-2.0; build-time |

The release dependency inventory lists every resolved transitive build and test
dependency and identifies whether it is included in a distributed artifact.

## Distribution metadata

| Component | Version | License |
|---|---:|---|
| `ds-store` | 0.1.6 | MIT; its clean Desktop Services Store template is used in the deterministic DMG layout |

## No endorsement

The names of upstream projects and contributors are used only for attribution.
Their inclusion does not imply endorsement of LitSquare Stage.

## Source and license evidence

- MCP Swift SDK: <https://github.com/modelcontextprotocol/swift-sdk>
- EventSource: <https://github.com/mattt/EventSource>
- Apple Swift packages: <https://github.com/apple>
- libwebp: <https://chromium.googlesource.com/webm/libwebp.git>
- Paper.js: <https://www.npmjs.com/package/paper>
- Three.js: <https://www.npmjs.com/package/three>
- Vite: <https://www.npmjs.com/package/vite>
- TypeScript: <https://www.npmjs.com/package/typescript>
- ds-store: <https://www.npmjs.com/package/ds-store>

This inventory is a technical license-compliance record, not legal advice.
