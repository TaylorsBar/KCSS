#!/usr/bin/env python3
"""
CartelWorx KCSS — Rollback Hook
Grok CI/CD performance pipeline
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
    with LOG_FILE.open("a") as f:
        f.write(line + "\n")

def rollback_deployment() -> bool:
    """
    Emergency rollback.
    Wire this to Firebase channel revert, previous artifact, or your own script.
    """
    log("═" * 60)
    log("⏪ CartelWorx KCSS — ROLLBACK initiated")
    log("═" * 60)

    rollback_sh = Path("./rollback.sh")
    if rollback_sh.exists():
        log("Found rollback.sh — executing...")
        result = subprocess.run(
            ["./rollback.sh"],
            capture_output=True,
            text=True,
            timeout=180,
        )
        log(result.stdout)
        if result.stderr:
            log("STDERR:\n" + result.stderr)
        success = result.returncode == 0
    else:
        log("No custom rollback.sh found.")
        log("Manual action required: revert Firebase Hosting channel or redeploy previous artifact.")
        log("Suggested: firebase hosting:clone SOURCE_SITE:SOURCE_CHANNEL TARGET_SITE:live")
        success = False

    if success:
        log("✅ Rollback complete — previous version restored")
    else:
        log("⚠️  Automatic rollback not fully configured — manual intervention needed")

    log("═" * 60)
    return success

if __name__ == "__main__":
    success = rollback_deployment()
    sys.exit(0 if success else 1)
