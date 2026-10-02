#!/usr/bin/env python3
"""Rollback hook for CartelWorx KCSS production hosting.

Uses ./rollback.sh when present. Otherwise clones the last Firebase Hosting
preview/live release is not automatic: this script records the exact command
maintainers should run and returns non-zero so CI stays red.
"""

from __future__ import annotations

import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path("rollback_log.txt")


def log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S UTC}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def rollback_deployment() -> bool:
    LOG_FILE.write_text("", encoding="utf-8")
    log("CartelWorx KCSS rollback started")

    rollback_sh = Path("./rollback.sh")
    if rollback_sh.exists():
        result = subprocess.run(["./rollback.sh"], capture_output=True, text=True, timeout=180)
        log(result.stdout or "")
        if result.stderr:
            log("STDERR:\n" + result.stderr)
        return result.returncode == 0

    project = os.environ.get("FIREBASE_PROJECT_ID", "<project>").strip() or "<project>"
    log("No ./rollback.sh found. Automatic channel clone is not configured.")
    log("Remediation:")
    log("1. Open Firebase Hosting release history and roll back the live channel.")
    log(
        "2. Or clone a known-good channel: "
        f"npx firebase-tools hosting:clone {project}:<good-channel> {project}:live"
    )
    log("3. Re-run the last green main commit rather than forward-fixing a red deploy.")
    log("4. Confirm FIREBASE_TOKEN still has Hosting Admin on the project.")
    return False


if __name__ == "__main__":
    sys.exit(0 if rollback_deployment() else 1)
