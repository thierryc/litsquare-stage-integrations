# LitSquare Stage Privacy Notice

Effective: July 17, 2026

This notice describes the LitSquare Stage native app, integration plugin,
templates, and npm runtime published by Thierry Charbonnel.

## Summary

LitSquare Stage does not require an account and does not include developer-run
analytics, telemetry, advertising, tracking pixels, hosted rendering, or
automatic crash upload. The publisher does not collect, sell, rent, or share
personal information through LitSquare Stage.

## Local processing

Projects, source assets, audio, frames, and rendered outputs are processed on
the Mac. The user chooses the project and output locations. LitSquare Stage
does not upload those files to a publisher-operated service.

The native MCP service binds only to `127.0.0.1:7460`. It is credential-free
and is available to processes running as the current user. Users should
connect only trusted local MCP clients and should treat commands from those
clients as local automation with their macOS account’s file access.

## Information stored on the Mac

LitSquare Stage can store:

- Render queue and terminal job state.
- A Dock status snapshot.
- App preferences and recent UI state.
- Diagnostic metadata needed to explain a failed render or mux.
- Failed video-only, WAV, and diagnostic artifacts for up to seven days,
  limited to the five latest failures.

Successful and cancelled intermediates are removed according to the renderer’s
cleanup rules. Users control their final project and output files.

## User-authored project networking

LitSquare Stage runs user-authored HTML, CSS, and JavaScript in a local WebKit
runtime. A project can make its own network requests when its source includes
remote URLs, scripts, fonts, APIs, or other network behavior. Those requests
are created by the project, not added by LitSquare Stage. Users are
responsible for the services and privacy terms their projects use.

## Apple and MCP clients

macOS may offer Apple crash and diagnostics reporting according to the user’s
system settings and Apple’s policies. Codex, Claude Code, Cursor, and other
MCP clients are separate products with their own privacy practices.

## Changes and questions

Material changes will update this notice and its effective date. Questions and
privacy issues can be opened at:
<https://github.com/thierryc/litsquare-stage-integrations/issues>

Do not include confidential material in a public issue.

