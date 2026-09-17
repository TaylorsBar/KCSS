#!/usr/bin/env python3
"""Rollback hook for TaylorsBar/KCSS."""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path("rollback_log.txt")


def log(msg: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{timestamp}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def rollback_deployment() -> bool:
    log("=" * 60)
    log("KCSS rollback initiated")
    rollback_sh = Path("./rollback.sh")
    if rollback_sh.exists():
        result = subprocess.run(
            ["./rollback.sh"],
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )
        log(result.stdout or "")
        if result.stderr:
            log("STDERR:\n" + result.stderr)
        success = result.returncode == 0
    else:
        log("No rollback.sh found")
        log("Manual: firebase hosting:clone SOURCE_SITE:SOURCE_CHANNEL TARGET_SITE:live")
        log("Or redeploy previous dist artifact from Actions")
        success = False
    log("Rollback complete" if success else "Automatic rollback not fully configured")
    return success


if __name__ == "__main__":
    sys.exit(0 if rollback_deployment() else 1)
