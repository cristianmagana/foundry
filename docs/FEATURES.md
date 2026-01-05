# Foundry Features

Foundry is a GitHub Action that provides deterministic repository creation with optional productionalization features for platform engineering teams.

## Table of Contents

- [Core Repository Features](#core-repository-features)
- [Productionalization Features](#productionalization-features)
- [Team Permissions](#team-permissions)
- [Environments](#environments)
- [Environment Variables](#environment-variables)
- [Branch Protection](#branch-protection)
- [Repository Secrets](#repository-secrets)
- [Repository Topics](#repository-topics)

---

## Core Repository Features

### Create a Basic Repository

Create a simple repository with auto-initialization:

```yaml
- name: Create Repository
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-new-repo'
    repository-description: 'A new repository'
    repository-private: 'false'
    auto-init: 'true'
```

**What this creates:**
- ✅ Empty repository with README.md
- ✅ Public visibility
- ✅ Created under your personal account or organization

---

### Create from Template Repository

Use an existing repository as a template:

```yaml
- name: Create from Template
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-service'
    repository-template: 'my-org/service-template'
    organization: 'my-org'
    repository-private: 'true'
```

**What this creates:**
- ✅ Repository based on template structure
- ✅ All files from template copied over
- ✅ Created in specified organization
- ✅ Private repository

---

### Initialize with .gitignore and License

```yaml
- name: Create with Gitignore and License
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'node-service'
    gitignore-template: 'Node'
    license-template: 'mit'
```

**What this creates:**
- ✅ Repository with Node.js .gitignore
- ✅ MIT license file
- ✅ README.md

---

### Set Custom Default Branch

```yaml
- name: Create with Custom Default Branch
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'develop-repo'
    default-branch: 'develop'
```

**What this creates:**
- ✅ Repository with `develop` as default branch
- ✅ Works with both new repositories and templates
- ✅ Automatically renames template default branch if needed

**Common use cases:**
- `main` - Modern default (recommended)
- `develop` - GitFlow workflow
- `master` - Legacy default
- `trunk` - Monorepo pattern

---

## Productionalization Features

Enable the full suite of productionalization features with a single flag:

```yaml
productionalize: 'true'
```

When enabled, you can configure:
- 🔐 Team permissions
- 🌍 Deployment environments
- 🔧 Environment variables
- 🛡️ Branch protection rules
- 🔒 Repository secrets
- 🏷️ Repository topics

---

## Team Permissions

Automatically assign teams with specific permission levels to your repository.

### Example: Basic Team Setup

```yaml
- name: Create with Team Permissions
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'platform-service'
    organization: 'my-org'
    productionalize: 'true'
    team-permissions: |
      [
        {"teamSlug": "platform-admins", "permission": "admin"},
        {"teamSlug": "developers", "permission": "push"},
        {"teamSlug": "contractors", "permission": "pull"}
      ]
```

**Available Permissions:**
- `admin` - Full administrative access
- `maintain` - Maintain access (push + some admin)
- `push` - Read and write access
- `triage` - Triage access (read + limited write)
- `pull` - Read-only access

**Result:**
- ✅ `platform-admins` team has full admin rights
- ✅ `developers` team can push code
- ✅ `contractors` team has read-only access

---

## Environments

Create deployment environments with protection rules and required reviewers.

### Example: Production and Staging Environments

```yaml
- name: Create with Environments
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'api-service'
    organization: 'my-org'
    productionalize: 'true'
    environments: |
      [
        {
          "name": "production",
          "reviewers": [
            {"type": "Team", "slug": "platform-admins"},
            {"type": "User", "slug": "john-doe"}
          ],
          "waitTimer": 30,
          "preventSelfReview": true
        },
        {
          "name": "staging",
          "reviewers": [{"type": "Team", "slug": "developers"}]
        },
        {
          "name": "development"
        }
      ]
```

**Environment Configuration:**
- `name` - Environment name (required)
- `reviewers` - Required reviewers (optional)
  - `type`: `"Team"` or `"User"`
  - `slug`: Team slug or username
- `waitTimer` - Wait time in minutes before deployment (0-43,200)
- `preventSelfReview` - Prevent self-approval (requires reviewers)

**Result:**
- ✅ Production environment requires team + user approval
- ✅ 30-minute wait timer for production deployments
- ✅ Staging requires developer team approval
- ✅ Development environment has no restrictions

---

## Environment Variables

Configure environment-specific variables with automatic case normalization.

### Example: Multi-Environment Variables

```yaml
- name: Create with Environment Variables
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'web-app'
    productionalize: 'true'
    environments: |
      [
        {"name": "production"},
        {"name": "staging"}
      ]
    environment-variables: |
      [
        {
          "environmentName": "production",
          "variables": [
            {"name": "nodeEnv", "value": "production"},
            {"name": "apiBaseUrl", "value": "https://api.example.com"},
            {"name": "logLevel", "value": "error"}
          ]
        },
        {
          "environmentName": "staging",
          "variables": [
            {"name": "nodeEnv", "value": "staging"},
            {"name": "apiBaseUrl", "value": "https://staging-api.example.com"},
            {"name": "logLevel", "value": "debug"}
          ]
        }
      ]
```

**Auto-Normalization:**
- `nodeEnv` → `NODE_ENV`
- `apiBaseUrl` → `API_BASE_URL`
- `logLevel` → `LOG_LEVEL`

Variables are automatically converted to `UPPER_SNAKE_CASE` for consistency.

**Result:**
- ✅ Production has production API URL and error-level logging
- ✅ Staging has staging API URL and debug-level logging
- ✅ All variable names normalized to uppercase

---

## Branch Protection

Apply preset branch protection rules for security and code quality.

### Example: Strict Branch Protection

```yaml
- name: Create with Branch Protection
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'critical-service'
    productionalize: 'true'
    branch-protection-preset: 'strict'
    branch-protection-target-branch: 'main'
```

### Protection Presets

#### Strict (Recommended for Production)
- ✅ Require pull request reviews (2 approvals)
- ✅ Dismiss stale reviews when new commits pushed
- ✅ Require review from code owners
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Require signed commits
- ✅ Restrict who can push
- ✅ Lock branch (prevent deletion)

#### Moderate (Balanced)
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require conversation resolution
- ✅ Lock branch

#### Minimal (Lightweight)
- ✅ Require pull request before merging
- ✅ Lock branch

---

## Repository Secrets

Securely upload encrypted secrets for CI/CD pipelines.

### Example: CI/CD Secrets

```yaml
- name: Create with Secrets
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'build-service'
    productionalize: 'true'
    repository-secrets: |
      [
        {"name": "NPM_TOKEN", "value": "${{ secrets.NPM_TOKEN }}"},
        {"name": "DOCKER_USERNAME", "value": "${{ secrets.DOCKER_USERNAME }}"},
        {"name": "DOCKER_PASSWORD", "value": "${{ secrets.DOCKER_PASSWORD }}"},
        {"name": "AWS_ACCESS_KEY_ID", "value": "${{ secrets.AWS_ACCESS_KEY_ID }}"},
        {"name": "AWS_SECRET_ACCESS_KEY", "value": "${{ secrets.AWS_SECRET_ACCESS_KEY }}"}
      ]
```

**How it Works:**
1. Secrets are encrypted using libsodium (sealed boxes)
2. Encrypted with repository's public key
3. Securely uploaded via GitHub API
4. Available in Actions workflows as `secrets.SECRET_NAME`

**Result:**
- ✅ All secrets encrypted before upload
- ✅ Secrets available in GitHub Actions
- ✅ Secrets hidden in logs and UI

---

## Repository Topics

Add topics for organization and discoverability.

### Example: Add Topics

```yaml
- name: Create with Topics
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'microservice'
    productionalize: 'true'
    repository-topics: 'nodejs,microservice,api,production,docker'
```

**Comma-Separated Format:**
```yaml
repository-topics: 'nodejs,typescript,api'
```

**JSON Array Format:**
```yaml
repository-topics: |
  ["nodejs", "typescript", "api"]
```

**Topic Merging:**
- Existing topics are preserved
- New topics are added
- Duplicates are automatically removed

**Result:**
- ✅ Topics added to repository
- ✅ Improves discoverability in GitHub search
- ✅ Helps organize repositories

---

## Complete Example: Production-Ready Repository

Here's a full example combining all features:

```yaml
name: Create Production Service
on:
  workflow_dispatch:
    inputs:
      service-name:
        description: 'Service name'
        required: true

jobs:
  create-service:
    runs-on: ubuntu-latest
    steps:
      - name: Create Production-Ready Service
        uses: crmagz/foundry@v1
        with:
          # Core settings
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository-name: ${{ inputs.service-name }}
          repository-description: 'Production microservice'
          repository-template: 'my-org/microservice-template'
          organization: 'my-org'
          repository-private: 'true'
          gitignore-template: 'Node'
          license-template: 'mit'
          default-branch: 'main'

          # Enable productionalization
          productionalize: 'true'

          # Team access
          team-permissions: |
            [
              {"teamSlug": "platform-admins", "permission": "admin"},
              {"teamSlug": "backend-developers", "permission": "push"},
              {"teamSlug": "qa-team", "permission": "triage"}
            ]

          # Topics
          repository-topics: 'microservice,nodejs,production,api'

          # Environments
          environments: |
            [
              {
                "name": "production",
                "reviewers": [{"type": "Team", "slug": "platform-admins"}],
                "waitTimer": 30,
                "preventSelfReview": true
              },
              {
                "name": "staging",
                "reviewers": [{"type": "Team", "slug": "backend-developers"}]
              },
              {
                "name": "development"
              }
            ]

          # Environment variables
          environment-variables: |
            [
              {
                "environmentName": "production",
                "variables": [
                  {"name": "nodeEnv", "value": "production"},
                  {"name": "logLevel", "value": "error"},
                  {"name": "apiTimeout", "value": "30000"}
                ]
              },
              {
                "environmentName": "staging",
                "variables": [
                  {"name": "nodeEnv", "value": "staging"},
                  {"name": "logLevel", "value": "debug"},
                  {"name": "apiTimeout", "value": "60000"}
                ]
              }
            ]

          # Branch protection
          branch-protection-preset: 'strict'
          branch-protection-target-branch: 'main'

          # Secrets
          repository-secrets: |
            [
              {"name": "NPM_TOKEN", "value": "${{ secrets.NPM_TOKEN }}"},
              {"name": "AWS_ACCESS_KEY_ID", "value": "${{ secrets.AWS_ACCESS_KEY_ID }}"},
              {"name": "AWS_SECRET_ACCESS_KEY", "value": "${{ secrets.AWS_SECRET_ACCESS_KEY }}"}
            ]

      - name: Output Repository Info
        run: |
          echo "Repository URL: ${{ steps.create-service.outputs.repository-url }}"
          echo "Repository Name: ${{ steps.create-service.outputs.repository-name }}"
          echo "Repository ID: ${{ steps.create-service.outputs.repository-id }}"
```

**This creates a fully production-ready repository with:**
- ✅ Template-based structure
- ✅ Team-based access control
- ✅ Three deployment environments
- ✅ Environment-specific configuration
- ✅ Strict branch protection
- ✅ CI/CD secrets configured
- ✅ Organized with topics

---

## Next Steps

- 📖 [How to Use from Marketplace](./MARKETPLACE.md)
- 🧪 [Local Testing with Act](./TESTING.md)
- 🔧 [API Reference](./API.md)
