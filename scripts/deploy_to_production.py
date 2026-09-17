#!/usr/bin/env python3
"""Production deploy hook for TaylorsBar/KCSS."""

from __future__ import annotations

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path("deploy_log.txt")


def log(msg: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{timestamp}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def deploy_to_production() -> bool:
    log("=" * 60)
    log("KCSS production deploy hook started")
    deploy_sh = Path("./deploy.sh")
    if deploy_sh.exists():
        result = subprocess.run(
            ["./deploy.sh"],
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
        log(result.stdout or "")
        if result.stderr:
            log("STDERR:\n" + result.stderr)
        success = result.returncode == 0
    else:
        log("No deploy.sh — treating GitHub Firebase action as primary deploy")
        success = True
    log("Deployment successful" if success else "Deployment failed")
    return success


if __name__ == "__main__":
    sys.exit(0 if deploy_to_production() else 1)
