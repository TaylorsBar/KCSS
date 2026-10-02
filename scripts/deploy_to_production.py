#!/usr/bin/env python3
"""Production deploy hook for CartelWorx KCSS.

Primary path is Firebase Hosting (`dist/`). A local ./deploy.sh overrides that
if present. Called by .github/workflows/cicd-grok.yml on push to main.
"""

from __future__ import annotations

import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG_FILE = Path("deploy_log.txt")


def log(msg: str) -> None:
    line = f"[{datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S UTC}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def _run(cmd: list[str], timeout: int = 300) -> subprocess.CompletedProcess[str]:
    log("running: " + " ".join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.stdout:
        log(result.stdout.rstrip())
    if result.stderr:
        log("STDERR:\n" + result.stderr.rstrip())
    log(f"exit={result.returncode}")
    return result


def deploy_to_production() -> bool:
    LOG_FILE.write_text("", encoding="utf-8")
    log("CartelWorx KCSS production deploy started")
    log(f"sha={os.environ.get('GITHUB_SHA', 'local')} ref={os.environ.get('GITHUB_REF', 'local')}")

    if not Path("dist").is_dir():
        log("dist/ missing; running npm run build")
        build = _run(["npm", "run", "build"])
        if build.returncode != 0:
            log("build failed before deploy")
            return False

    deploy_sh = Path("./deploy.sh")
    if deploy_sh.exists():
        result = _run(["./deploy.sh"])
        return result.returncode == 0

    project = os.environ.get("FIREBASE_PROJECT_ID", "").strip()
    token = os.environ.get("FIREBASE_TOKEN", "").strip()
    if not project or not token:
        log("FIREBASE_PROJECT_ID or FIREBASE_TOKEN is unset")
        log("Remediation: add both repository secrets, or provide ./deploy.sh")
        return False

    result = _run(
        [
            "npx",
            "--yes",
            "firebase-tools@13",
            "deploy",
            "--only",
            "hosting",
            "--project",
            project,
            "--token",
            token,
            "--non-interactive",
        ],
        timeout=420,
    )
    ok = result.returncode == 0
    log("Deployment successful" if ok else "Deployment failed")
    return ok


if __name__ == "__main__":
    sys.exit(0 if deploy_to_production() else 1)
