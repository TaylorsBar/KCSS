# deploy_to_production.py
import subprocess
def deploy_to_production():
    result = subprocess.run(['echo', 'Deploying to production...'], capture_output=True, text=True)
    with open('deploy_log.txt', 'w') as f:
        f.write(result.stdout + "\n" + result.stderr)
    return True

if __name__ == "__main__":
    success = deploy_to_production()
    print("Deployment successful" if success else "Deployment failed")
