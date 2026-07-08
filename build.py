#!/usr/bin/env python3
"""將 config、sections、examples 打包為 bundle.js，支援 file:// 本地直接開啟。"""

import json
from pathlib import Path

ROOT = Path(__file__).parent
NAV_PATH = ROOT / "config" / "nav.json"
SECTIONS_DIR = ROOT / "content" / "sections"
EXAMPLES_DIR = ROOT / "content" / "examples"
OUT_PATH = ROOT / "content" / "bundle.js"


def main() -> None:
    nav = json.loads(NAV_PATH.read_text(encoding="utf-8"))

    sections: dict[str, str] = {}
    for section_id, meta in nav.get("sections", {}).items():
        file_path = ROOT / meta["file"]
        if not file_path.exists():
            raise FileNotFoundError(f"找不到欄目檔案：{file_path}")
        sections[section_id] = file_path.read_text(encoding="utf-8").strip()

    examples: dict[str, str] = {}
    if EXAMPLES_DIR.exists():
        for example_file in sorted(EXAMPLES_DIR.iterdir()):
            if example_file.is_file():
                rel_path = example_file.relative_to(ROOT).as_posix()
                examples[rel_path] = example_file.read_text(encoding="utf-8").strip()

    bundle = {"nav": nav, "sections": sections, "examples": examples}
    js = "// 自動生成，請勿手動編輯。修改內容後執行：python3 build.py\n"
    js += "window.GUIDELINES_BUNDLE = "
    js += json.dumps(bundle, ensure_ascii=False, indent=2)
    js += ";\n"

    OUT_PATH.write_text(js, encoding="utf-8")
    print(f"已生成 {OUT_PATH.relative_to(ROOT)}（{len(sections)} 個欄目，{len(examples)} 個範例）")


if __name__ == "__main__":
    main()
