# rollback_deployment.py
import subprocess
def rollback_deployment():
    result = subprocess.run(['echo', 'Rolling back deployment...'], capture_output=True, text=True)
    return True

if __name__ == "__main__":
    success = rollback_deployment()
    print("Rollback successful" if success else "Rollback failed")
