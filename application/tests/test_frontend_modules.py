"""Check the production Jinja and ES-module entrypoints without starting hardware services."""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

from flask import Flask
from jinja2 import meta


APPLICATION = Path(__file__).resolve().parents[1]
STATIC = APPLICATION / "static"


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.assets = []
        self.inline_handlers = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.inline_handlers.extend(name for name in attrs if name.startswith("on"))
        if tag == "script":
            self.scripts.append(attrs)
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.assets.append(attrs["href"])


class FrontendModulesTest(unittest.TestCase):
    def test_each_page_renders_one_entrypoint_and_resolvable_styles(self):
        app = Flask(__name__, template_folder=str(APPLICATION / "templates"), static_folder=str(STATIC))
        pages = set()
        with app.test_request_context("/", environ_overrides={"SCRIPT_NAME": "/controller"}):
            for path in sorted((APPLICATION / "templates").glob("*.html")):
                if path.name == "base.html":
                    continue
                with self.subTest(page=path.stem):
                    source = path.read_text(encoding="utf-8")
                    variables = meta.find_undeclared_variables(app.jinja_env.parse(source))
                    inputs = {name: [] for name in variables if name not in app.jinja_env.globals}
                    html = app.jinja_env.get_template(path.name).render(**inputs)
                    parser = AssetParser()
                    parser.feed(html)
                    self.assertEqual(parser.inline_handlers, [])
                    scripts = [s for s in parser.scripts if s.get("type") != "application/json"]
                    self.assertEqual(len(scripts), 1)
                    self.assertEqual(scripts[0]["type"], "module")
                    expected = f"/controller/static/js/pages/{path.stem}_page.js"
                    self.assertEqual(scripts[0]["src"], expected)
                    for url in [expected, *parser.assets]:
                        self.assertTrue(url.startswith("/controller/static/"), url)
                        self.assertTrue((STATIC / url.removeprefix("/controller/static/")).is_file(), url)
                    pages.add(expected.rsplit("/", 1)[1])
        self.assertEqual(pages, {p.name for p in (STATIC / "js/pages").glob("*.js")})

    def test_transitive_imports_stay_inside_deployed_assets(self):
        pending = list((STATIC / "js/pages").glob("*.js"))
        visited = set()
        while pending:
            module = pending.pop().resolve()
            if module in visited:
                continue
            visited.add(module)
            self.assertTrue(module.is_relative_to(STATIC.resolve()), module)
            self.assertTrue(module.is_file(), module)
            source = module.read_text(encoding="utf-8")
            for specifier in re.findall(r"""(?:\bfrom\s*|^\s*import\s*)["']([^"']+)["']""", source, re.MULTILINE):
                with self.subTest(module=module.name, specifier=specifier):
                    self.assertTrue(specifier.startswith("."), specifier)
                    target = (module.parent / specifier).resolve()
                    if module.is_relative_to((STATIC / "vendor/templates").resolve()):
                        self.assertTrue(target.is_relative_to((STATIC / "vendor/templates").resolve()))
                    pending.append(target)
