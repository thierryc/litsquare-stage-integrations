#!/usr/bin/env python3
"""Validate this repository's supported Codex/Claude compatibility package.

This is a repository release gate, not an OpenAI certification tool. Reference:
https://developers.openai.com/plugins/build/plugins
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

import yaml


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def local_path(root: Path, value: str) -> Path:
    require(isinstance(value, str) and value.startswith("./"), f"Expected ./-relative path: {value!r}")
    path = (root / value).resolve()
    require(path.is_relative_to(root.resolve()), f"Path escapes package: {value}")
    require(path.exists(), f"Missing package path: {value}")
    return path


def validate(root: Path, marketplace_root: Path | None = None) -> dict:
    root = root.resolve()
    codex = json.loads((root / ".codex-plugin/plugin.json").read_text())
    claude = json.loads((root / ".claude-plugin/plugin.json").read_text())
    for label, manifest in [("Codex", codex), ("Claude Code", claude)]:
        require(bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", manifest.get("name", ""))), f"Invalid {label} plugin name")
        require(bool(re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?", manifest.get("version", ""))), f"Invalid {label} version")
        require(isinstance(manifest.get("description"), str) and bool(manifest["description"].strip()), f"Missing {label} description")
        require(bool(manifest.get("author", {}).get("name")), f"Missing {label} author")
    for key in ["name", "version", "description"]:
        require(codex[key] == claude[key], f"Client manifests disagree on {key}")

    skills_root = local_path(root, codex["skills"])
    skills = []
    for path in sorted(skills_root.glob("*/SKILL.md")):
        require(path.resolve().is_relative_to(root), f"Skill escapes package: {path.name}")
        text = path.read_text()
        parts = text.split("---", 2)
        require(len(parts) == 3 and not parts[0].strip(), f"Missing frontmatter: {path}")
        header = yaml.safe_load(parts[1])
        require(isinstance(header, dict), f"Invalid skill frontmatter: {path}")
        require(header.get("name") == path.parent.name, f"Skill name/directory mismatch: {path}")
        require(isinstance(header.get("description"), str) and bool(header["description"].strip()), f"Missing skill description: {path}")
        require(bool(parts[2].strip()), f"Empty skill instructions: {path}")
        skills.append(header["name"])
    require(bool(skills), "No packaged skills")
    require(len(skills) == len(set(skills)), "Duplicate skill names")

    interface = codex.get("interface", {})
    for key in ["composerIcon", "logo", "logoDark"]:
        if key in interface:
            local_path(root, interface[key])
    for value in interface.get("screenshots", []):
        local_path(root, value)
    for key in ["websiteURL", "privacyPolicyURL", "termsOfServiceURL"]:
        if key in interface:
            require(urlsplit(interface[key]).scheme == "https", f"Expected HTTPS for {key}")
    for label, manifest in [("Codex", codex), ("Claude Code", claude)]:
        mcp = json.loads(local_path(root, manifest["mcpServers"]).read_text())
        servers = mcp.get("mcpServers", {})
        require(bool(servers), f"No {label} MCP servers")
        for server in servers.values():
            require(server.get("type") == "http", f"Unexpected {label} compatibility transport")
            require(server.get("url") == "http://127.0.0.1:7460/mcp", f"Unexpected {label} Stage endpoint")

    # Reject escaped symlinks anywhere, including references and template assets.
    for path in root.rglob("*"):
        require(path.resolve().is_relative_to(root), f"Package symlink escapes root: {path}")
    if marketplace_root:
        repo = marketplace_root.resolve()
        for relative in [".agents/plugins/marketplace.json", ".claude-plugin/marketplace.json"]:
            catalog = json.loads((repo / relative).read_text())
            entries = [item for item in catalog["plugins"] if item["name"] == codex["name"]]
            require(len(entries) == 1, f"Expected one plugin entry in {relative}")
            source = entries[0]["source"]
            source = source["path"] if isinstance(source, dict) else source
            require(local_path(repo, source) == root, f"Marketplace points to a different package: {relative}")
            if "version" in entries[0]:
                require(entries[0]["version"] == codex["version"], "Marketplace/plugin versions disagree")
    return {"status": "passed", "format": "codex-claude-compatibility", "name": codex["name"], "version": codex["version"], "skills": skills}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plugin", type=Path)
    parser.add_argument("--marketplace-root", type=Path)
    args = parser.parse_args()
    repo = args.marketplace_root
    if repo is None and args.plugin.resolve().parent.name == "plugins":
        repo = args.plugin.resolve().parent.parent
    try:
        print(json.dumps(validate(args.plugin, repo), indent=2))
    except (ValueError, KeyError, OSError, TypeError, yaml.YAMLError) as error:
        parser.exit(1, f"Plugin validation failed: {error}\n")


if __name__ == "__main__":
    main()
