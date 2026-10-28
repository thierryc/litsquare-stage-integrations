import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

script = Path(__file__).resolve().parents[1] / "release/scripts/validate_plugin.py"
spec = importlib.util.spec_from_file_location("stage_plugin_validation", script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PluginValidationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "plugin"
        self.root.mkdir()
        self.manifest = {"name": "stage-test", "version": "1.2.3", "description": "A test plugin",
                         "author": {"name": "Test"}, "skills": "./skills/", "mcpServers": "./.mcp.json"}
        for client in [".codex-plugin", ".claude-plugin"]:
            (self.root / client).mkdir()
            (self.root / client / "plugin.json").write_text(json.dumps(self.manifest))
        skill = self.root / "skills/test-skill/SKILL.md"
        skill.parent.mkdir(parents=True)
        skill.write_text("---\nname: test-skill\ndescription: Test an installed app.\n---\nCheck the app.\n")
        (self.root / ".mcp.json").write_text(json.dumps({"mcpServers": {"stage": {"type": "http", "url": "http://127.0.0.1:7460/mcp"}}}))

    def test_valid_compatibility_package(self):
        self.assertEqual(module.validate(self.root)["skills"], ["test-skill"])

    def test_rejects_version_drift(self):
        self.manifest["version"] = "1.2.4"
        (self.root / ".claude-plugin/plugin.json").write_text(json.dumps(self.manifest))
        with self.assertRaisesRegex(ValueError, "disagree on version"):
            module.validate(self.root)

    def test_rejects_escaped_assets(self):
        (self.root.parent / "outside.png").write_bytes(b"outside")
        self.manifest["interface"] = {"logo": "./../outside.png"}
        (self.root / ".codex-plugin/plugin.json").write_text(json.dumps(self.manifest))
        with self.assertRaisesRegex(ValueError, "escapes package"):
            module.validate(self.root)

    def test_rejects_symlinks_outside_package(self):
        outside = self.root.parent / "private.txt"
        outside.write_text("not part of package")
        (self.root / "reference.txt").symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "symlink escapes"):
            module.validate(self.root)

    def test_rejects_wrong_skill_identity(self):
        (self.root / "skills/test-skill/SKILL.md").write_text("---\nname: other\ndescription: Test.\n---\nDo it.\n")
        with self.assertRaisesRegex(ValueError, "name/directory mismatch"):
            module.validate(self.root)

    def test_rejects_unexpected_renderer_endpoint(self):
        (self.root / ".mcp.json").write_text(json.dumps({"mcpServers": {"stage": {"type": "http", "url": "http://example.com/mcp"}}}))
        with self.assertRaisesRegex(ValueError, "Stage endpoint"):
            module.validate(self.root)


if __name__ == "__main__":
    unittest.main()
