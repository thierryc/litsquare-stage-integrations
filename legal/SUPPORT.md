# LitSquare Stage Support

LitSquare Stage support is provided through the public
[issue tracker](https://github.com/thierryc/litsquare-stage-integrations/issues).

## Before opening an issue

1. Confirm that the LitSquare Stage app is running.
2. Confirm that the app reports MCP ready at
   `http://127.0.0.1:7460/mcp`.
3. Use **Copy MCP Compatibility Report** in the app.
4. Reproduce the issue with the smallest project that still demonstrates it.
5. Include the app version/build, client name/version, requested output format,
   expected behavior, actual behavior, and terminal job state.

The compatibility report intentionally excludes project paths, output paths,
user content, credentials, and Keychain profile names.

## Protect private information

Do not post API keys, passwords, tokens, signing identities, app-specific
passwords, customer media, private project source, absolute home-directory
paths, or full diagnostic archives without reviewing and redacting them.

For a security-sensitive issue, create a minimal public issue that contains no
exploit details or secrets and asks the publisher to arrange a private
follow-up. LitSquare Stage does not publish a support email for this release.

## Common checks

- A port conflict on `127.0.0.1:7460` prevents MCP readiness.
- Browser requests and remote origins are intentionally rejected.
- The app accepts local project and output paths accessible to the current
  macOS user.
- Optional AVIF and HEIC behavior depends on system encoder availability.
- The legacy compatibility adapter is deprecated and is scheduled for removal
  in LitSquare Stage 1.0.
- LitSquare Stage `0.9.5` supports Apple Silicon and macOS 26 or later.

## Bug reports

Use:
<https://github.com/thierryc/litsquare-stage-integrations/issues/new/choose>

Include only the information required to reproduce and diagnose the issue.
