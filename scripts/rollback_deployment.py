#!/usr/bin/env python3
"""Rollback hook for CartelWorx KCSS.

Wire rollback.sh to a real revert (Firebase channel clone or previous artifact).
Without that script this returns non-zero so CI flags manual remediation.
"""

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path("rollback_log.txt")


def log(msg: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{timestamp}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def rollback_deployment() -> bool:
    log("=" * 60)
    log("CartelWorx KCSS rollback started")
    log("=" * 60)

    rollback_sh = Path("./rollback.sh")
    if rollback_sh.exists():
        log("Found rollback.sh — executing")
        result = subprocess.run(
            ["./rollback.sh"],
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )
        if result.stdout:
            log(result.stdout)
        if result.stderr:
            log("STDERR:\n" + result.stderr)
        success = result.returncode == 0
    else:
        log("No rollback.sh found.")
        log("Remediation: firebase hosting:clone <site>:<previous-channel> <site>:live")
        log("Or redeploy the last green dist artifact from Actions.")
        success = False

    log("Rollback complete" if success else "Rollback not fully automated")
    log("=" * 60)
    return success


if __name__ == "__main__":
    sys.exit(0 if rollback_deployment() else 1)
