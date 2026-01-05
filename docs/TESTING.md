# Testing Foundry Locally with Act

This guide explains how to test the Foundry GitHub Action locally using [act](https://github.com/nektos/act), a tool that runs GitHub Actions workflows in Docker containers on your local machine.

## Table of Contents

- [What is Act?](#what-is-act)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Testing Scenarios](#testing-scenarios)
- [Configuration](#configuration)
- [Environment Variables and Secrets](#environment-variables-and-secrets)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## What is Act?

**Act** allows you to run GitHub Actions locally without pushing to GitHub. It:

- ✅ Runs workflows in Docker containers
- ✅ Uses the same workflow syntax as GitHub Actions
- ✅ Supports secrets and environment variables
- ✅ Provides fast feedback during development
- ✅ Works offline (after initial Docker image pull)

**Use cases:**
- Testing action changes before pushing
- Debugging workflow issues
- Validating configuration changes
- Development without consuming GitHub Actions minutes

---

## Installation

### macOS (via Homebrew)

```bash
brew install act
```

### Linux

```bash
# Using curl
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Or download binary from releases
wget https://github.com/nektos/act/releases/latest/download/act_Linux_x86_64.tar.gz
tar xzf act_Linux_x86_64.tar.gz
sudo mv act /usr/local/bin/
```

### Windows (via Chocolatey)

```bash
choco install act-cli
```

### Verify Installation

```bash
act --version
```

### Docker Requirement

Act requires Docker to be installed and running:

```bash
# Check Docker is installed
docker --version

# Check Docker daemon is running
docker ps
```

---

## Quick Start

### 1. Build the Action

Before testing, build the action:

```bash
make build
```

Or:

```bash
npm install
npm run build
```

### 2. Run the Test Workflow

The repository includes a test workflow at `.github/workflows/test-local.yml`:

```bash
act workflow_dispatch -W .github/workflows/test-local.yml
```

### 3. Provide Required Inputs

Act will prompt for workflow inputs. You can also provide them via flags:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --input repository-name="test-repo-$(date +%s)" \
  --input repository-description="Test repository" \
  --input repository-private="false"
```

### 4. Set GitHub Token

Act needs your GitHub token to create repositories:

```bash
# Option 1: Via environment variable (act auto-detects)
export GITHUB_TOKEN=ghp_your_token_here
act workflow_dispatch -W .github/workflows/test-local.yml

# Option 2: Via secrets flag
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  -s GITHUB_TOKEN=ghp_your_token_here

# Option 3: Via .secrets file (recommended)
echo "GITHUB_TOKEN=ghp_your_token_here" > .secrets
act workflow_dispatch -W .github/workflows/test-local.yml --secret-file .secrets
```

**Important:** Add `.secrets` to `.gitignore` to avoid committing tokens!

---

## Testing Scenarios

### Basic Repository Creation

Test creating a simple repository:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --input repository-name="basic-test-$(date +%s)" \
  --input repository-description="Basic test repository" \
  --input repository-private="false" \
  --input productionalize="false" \
  --secret-file .secrets
```

**What this tests:**
- Repository creation
- Auto-initialization
- Gitignore and license templates
- Basic configuration

### Productionalization Features

Test with full productionalization enabled:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --input repository-name="prod-test-$(date +%s)" \
  --input repository-description="Production test repository" \
  --input repository-private="true" \
  --input organization="your-org" \
  --input productionalize="true" \
  --secret-file .secrets
```

**What this tests:**
- Team permissions assignment
- Environment creation with reviewers
- Environment variables configuration
- Branch protection rules
- Repository secrets
- Topics

### Template-Based Creation

Test creating from a template repository:

```bash
# First, ensure you have a template repository
# Then run:
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --input repository-name="template-test-$(date +%s)" \
  --input repository-template="your-org/your-template" \
  --input organization="your-org" \
  --secret-file .secrets
```

### Dry Run (List Steps)

See what would run without executing:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --list
```

### Verbose Output

Get detailed execution logs:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --input repository-name="verbose-test-$(date +%s)" \
  --secret-file .secrets \
  --verbose
```

### Specific Job

Run only a specific job:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --job create-repository \
  --input repository-name="job-test-$(date +%s)" \
  --secret-file .secrets
```

---

## Configuration

### .actrc File

Create an `.actrc` file in the repository root for default configuration:

```bash
# .actrc
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--secret-file .secrets
--container-architecture linux/amd64
```

Now you can run act with simpler commands:

```bash
act workflow_dispatch -W .github/workflows/test-local.yml
```

### Platform Configuration

Specify Docker image for runners:

```bash
# Use GitHub's actual runner image (large, ~20GB)
act -P ubuntu-latest=catthehacker/ubuntu:full-latest

# Use medium image (recommended, ~900MB)
act -P ubuntu-latest=catthehacker/ubuntu:act-latest

# Use minimal image (small, may miss dependencies)
act -P ubuntu-latest=node:24-slim
```

### Custom Workflow File

Create a custom test workflow for specific scenarios:

```yaml
# .github/workflows/act-test.yml
name: Act Test
on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '24'

      - run: npm ci
      - run: npm run build

      - name: Test Action
        uses: ./
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository-name: 'act-test-${{ github.run_number }}'
          repository-description: 'Act test repository'
          auto-init: 'true'
```

Run it:

```bash
act push -W .github/workflows/act-test.yml --secret-file .secrets
```

---

## Environment Variables and Secrets

### Setting Secrets

**Method 1: .secrets file (Recommended)**

```bash
# Create .secrets file
cat > .secrets << EOF
GITHUB_TOKEN=ghp_your_token_here
NPM_TOKEN=npm_token_here
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
EOF

# Use in act
act workflow_dispatch -W .github/workflows/test-local.yml --secret-file .secrets
```

**Method 2: Command line**

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  -s GITHUB_TOKEN=ghp_your_token \
  -s NPM_TOKEN=npm_token
```

**Method 3: Environment variables**

Act automatically picks up `GITHUB_TOKEN` from your environment:

```bash
export GITHUB_TOKEN=ghp_your_token
act workflow_dispatch -W .github/workflows/test-local.yml
```

### Setting Environment Variables

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --env NODE_ENV=development \
  --env LOG_LEVEL=debug \
  --secret-file .secrets
```

### .env File

Create a `.env` file for environment variables:

```bash
# .env
NODE_ENV=development
LOG_LEVEL=debug
API_TIMEOUT=30000
```

Use it:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --env-file .env \
  --secret-file .secrets
```

---

## Troubleshooting

### Issue: "Docker daemon not running"

**Error:**
```
Cannot connect to the Docker daemon
```

**Solution:**
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker daemon (Linux)
sudo systemctl start docker

# Verify
docker ps
```

### Issue: "Permission denied" on Docker socket

**Error:**
```
permission denied while trying to connect to the Docker daemon socket
```

**Solution (Linux):**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker
```

### Issue: "Container architecture mismatch" (M1/M2 Macs)

**Error:**
```
WARNING: The requested image's platform (linux/amd64) does not match
```

**Solution:**
```bash
# Use ARM-compatible image or force amd64
act --container-architecture linux/amd64 workflow_dispatch \
  -W .github/workflows/test-local.yml
```

Or add to `.actrc`:
```
--container-architecture linux/amd64
```

### Issue: "GITHUB_TOKEN not set"

**Error:**
```
Error: github-token is required
```

**Solution:**
```bash
# Check token is in .secrets file
cat .secrets

# Or set environment variable
export GITHUB_TOKEN=ghp_your_token

# Or pass directly
act -s GITHUB_TOKEN=ghp_your_token workflow_dispatch
```

### Issue: "npm: command not found"

**Error:**
```
npm: command not found
```

**Solution:**

Use a runner image with Node.js pre-installed:

```bash
act -P ubuntu-latest=catthehacker/ubuntu:act-latest workflow_dispatch
```

Or specify in `.actrc`:
```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
```

### Issue: Action changes not reflected

**Problem:** After modifying the action, tests still use old version

**Solution:**
```bash
# Always rebuild before testing
make build
act workflow_dispatch -W .github/workflows/test-local.yml

# Or use the --reuse=false flag to avoid container reuse
act --reuse=false workflow_dispatch -W .github/workflows/test-local.yml
```

### Issue: "Resource not accessible by integration"

**Error:**
```
HttpError: Resource not accessible by integration
```

**Solution:**

Use a Personal Access Token (PAT) instead of `GITHUB_TOKEN`:

1. Create a PAT at: https://github.com/settings/tokens
2. Grant scopes: `repo`, `admin:org`, `workflow`
3. Add to `.secrets`:
   ```
   GITHUB_TOKEN=ghp_your_pat_token
   ```

### Debug Mode

Enable act's debug output:

```bash
act workflow_dispatch \
  -W .github/workflows/test-local.yml \
  --verbose \
  --secret-file .secrets 2>&1 | tee act-debug.log
```

---

## Best Practices

### 1. Always Rebuild Before Testing

```bash
# Use make for consistent builds
make clean
make build

# Then test
act workflow_dispatch -W .github/workflows/test-local.yml
```

### 2. Use Unique Repository Names

Avoid conflicts by using timestamps:

```bash
--input repository-name="test-repo-$(date +%s)"
```

Or random strings:

```bash
--input repository-name="test-repo-$(uuidgen | cut -d'-' -f1)"
```

### 3. Clean Up Test Repositories

Delete test repositories after validation:

```bash
# List repositories
gh repo list your-org --limit 100 | grep "test-repo"

# Delete specific repository
gh repo delete your-org/test-repo-1234567890 --yes
```

### 4. Use .actrc for Consistency

Create `.actrc` in repository root:

```bash
# .actrc - Act configuration
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--secret-file .secrets
--container-architecture linux/amd64
--artifact-server-path /tmp/artifacts
```

### 5. Separate Test Workflows

Create dedicated test workflows for different scenarios:

```
.github/workflows/
├── test-basic.yml          # Basic repository creation
├── test-template.yml       # Template-based creation
├── test-productionalize.yml # Full productionalization
└── test-local.yml          # Current test workflow
```

### 6. Document Your Test Process

Add a `TESTING_NOTES.md` with:
- Test scenarios
- Expected outcomes
- Known issues
- Cleanup procedures

### 7. Version Control for Test Data

Create test data files:

```bash
# test-data/basic-config.json
{
  "repository-name": "test-basic",
  "repository-description": "Basic test",
  "repository-private": "false"
}
```

Use in workflows or scripts to feed into act.

---

## Advanced Usage

### Testing Multiple Scenarios in Parallel

```bash
#!/bin/bash
# test-all.sh - Run all test scenarios

scenarios=(
  "basic-$(date +%s)"
  "template-$(date +%s)"
  "prod-$(date +%s)"
)

for scenario in "${scenarios[@]}"; do
  echo "Testing: $scenario"
  act workflow_dispatch \
    -W .github/workflows/test-local.yml \
    --input repository-name="$scenario" \
    --secret-file .secrets &
done

wait
echo "All tests completed"
```

### Integration with CI/CD

Use act in your CI pipeline to validate before deployment:

```yaml
# .github/workflows/validate.yml
name: Validate Action
on: pull_request

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Act
        run: |
          curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

      - name: Test with Act
        run: |
          act -l  # List workflows
          # Add specific act test commands
```

### Container Customization

Create custom runner image with pre-installed dependencies:

```dockerfile
# Dockerfile.act-runner
FROM catthehacker/ubuntu:act-latest

RUN apt-get update && apt-get install -y \
  jq \
  yq \
  && rm -rf /var/lib/apt/lists/*
```

Build and use:

```bash
docker build -f Dockerfile.act-runner -t foundry-act-runner .
act -P ubuntu-latest=foundry-act-runner workflow_dispatch
```

---

## Next Steps

- 📖 [View all features and examples](./FEATURES.md)
- 🏪 [Use from GitHub Marketplace](./MARKETPLACE.md)
- 🔧 [API Reference](./API.md)
- 🧪 [Run unit tests](../README.md#testing)
