#!/usr/bin/env python3
"""Production deploy hook for CartelWorx KCSS.

Firebase Hosting is the real deploy path (GitHub Action). This script is the
callable deploy_to_production() entrypoint for extra hooks and log capture.
"""

import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path("deploy_log.txt")


def log(msg: str) -> None:
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    line = f"[{timestamp}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def deploy_to_production() -> bool:
    log("=" * 60)
    log("CartelWorx KCSS production deploy hook started")
    log("=" * 60)

    deploy_sh = Path("./deploy.sh")
    if deploy_sh.exists():
        log("Found deploy.sh — executing")
        result = subprocess.run(
            ["./deploy.sh"],
            capture_output=True,
            text=True,
            timeout=300,
            check=False,
        )
        if result.stdout:
            log(result.stdout)
        if result.stderr:
            log("STDERR:\n" + result.stderr)
        success = result.returncode == 0
    else:
        log("No deploy.sh. Firebase Hosting action is the production path.")
        success = True

    log("Deployment successful" if success else "Deployment failed")
    log("=" * 60)
    return success


if __name__ == "__main__":
    sys.exit(0 if deploy_to_production() else 1)
