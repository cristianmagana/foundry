# Using Foundry from GitHub Marketplace

This guide explains how to use Foundry in your GitHub Actions workflows directly from the GitHub Marketplace.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Version Pinning](#version-pinning)
- [Required Permissions](#required-permissions)
- [Basic Usage](#basic-usage)
- [Workflow Integration](#workflow-integration)
- [Using Outputs](#using-outputs)
- [Security Best Practices](#security-best-practices)

---

## Quick Start

Add Foundry to your workflow file (`.github/workflows/create-repo.yml`):

```yaml
name: Create Repository
on: workflow_dispatch

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - name: Create Repository
        uses: crmagz/foundry@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository-name: 'my-new-repo'
          repository-description: 'Created with Foundry'
```

---

## Installation

### From GitHub Marketplace

1. **Browse to Marketplace**: Visit [GitHub Marketplace](https://github.com/marketplace) and search for "Foundry"
2. **Select the Action**: Click on the Foundry action
3. **Use in Workflow**: Copy the usage snippet provided by the marketplace

### Direct Reference

You can reference the action directly in your workflow without visiting the marketplace:

```yaml
- uses: crmagz/foundry@v1
```

No installation step is required. GitHub Actions automatically downloads and caches the action on first use.

---

## Version Pinning

Choose a versioning strategy that fits your needs:

### Major Version (Recommended)

```yaml
- uses: crmagz/foundry@v1
```

**Pros:**
- ✅ Automatically get bug fixes and new features
- ✅ Stays within major version (no breaking changes)

**Cons:**
- ⚠️ May introduce unexpected behavior changes

### Specific Version

```yaml
- uses: crmagz/foundry@v1.2.3
```

**Pros:**
- ✅ Fully deterministic
- ✅ No unexpected changes

**Cons:**
- ⚠️ Manual updates required for bug fixes

### Commit SHA (Maximum Security)

```yaml
- uses: crmagz/foundry@abc123def456...
```

**Pros:**
- ✅ Immutable reference
- ✅ Highest security (prevents tag manipulation)

**Cons:**
- ⚠️ Hard to track versions
- ⚠️ Manual updates required

### Latest (Not Recommended for Production)

```yaml
- uses: crmagz/foundry@main
```

**Risks:**
- ❌ May break unexpectedly
- ❌ No version control
- ❌ Only use for testing/development

---

## Required Permissions

### GitHub Token Permissions

The `GITHUB_TOKEN` must have sufficient permissions to create repositories and configure settings.

#### Default Token Permissions

For basic repository creation:

```yaml
permissions:
  contents: write
  repositories: write
```

#### Productionalization Permissions

For full productionalization features:

```yaml
permissions:
  contents: write
  repositories: write
  administration: write  # For team permissions and secrets
  environments: write    # For environment configuration
```

#### Organization-Level Permissions

If creating repositories in an organization, the token must have:
- Organization membership with appropriate role
- `repo` scope for the organization

#### Using Personal Access Token (PAT)

For advanced use cases, use a PAT instead of `GITHUB_TOKEN`:

```yaml
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.PAT_TOKEN }}
```

**Required PAT scopes:**
- `repo` - Full repository access
- `admin:org` - Organization administration (if creating in org)
- `workflow` - Update GitHub Action workflows

---

## Basic Usage

### Create Simple Repository

```yaml
name: Create Basic Repo
on: workflow_dispatch

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - uses: crmagz/foundry@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository-name: 'simple-repo'
          repository-description: 'A simple repository'
          repository-private: 'false'
          auto-init: 'true'
```

### Create from Template

```yaml
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-service'
    repository-template: 'my-org/service-template'
    organization: 'my-org'
    repository-private: 'true'
    default-branch: 'main'
```

### Create with Productionalization

```yaml
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'production-service'
    organization: 'my-org'
    default-branch: 'main'
    productionalize: 'true'
    team-permissions: |
      [
        {"teamSlug": "platform-admins", "permission": "admin"},
        {"teamSlug": "developers", "permission": "push"}
      ]
    environments: |
      [
        {"name": "production"},
        {"name": "staging"}
      ]
    branch-protection-preset: 'strict'
```

---

## Workflow Integration

### Self-Service Repository Creation

Create a workflow that allows team members to create repositories on-demand:

```yaml
name: Self-Service Repository Creation
on:
  workflow_dispatch:
    inputs:
      repo-name:
        description: 'Repository name'
        required: true
      repo-type:
        description: 'Repository type'
        required: true
        type: choice
        options:
          - microservice
          - library
          - frontend
      team:
        description: 'Team name'
        required: true

jobs:
  create-repository:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      repositories: write
      administration: write
      environments: write

    steps:
      - name: Determine Template
        id: template
        run: |
          case "${{ inputs.repo-type }}" in
            microservice)
              echo "template=my-org/microservice-template" >> $GITHUB_OUTPUT
              ;;
            library)
              echo "template=my-org/library-template" >> $GITHUB_OUTPUT
              ;;
            frontend)
              echo "template=my-org/frontend-template" >> $GITHUB_OUTPUT
              ;;
          esac

      - name: Create Repository
        id: foundry
        uses: crmagz/foundry@v1
        with:
          github-token: ${{ secrets.PAT_TOKEN }}
          repository-name: ${{ inputs.repo-name }}
          repository-template: ${{ steps.template.outputs.template }}
          organization: 'my-org'
          repository-private: 'true'
          productionalize: 'true'
          team-permissions: |
            [
              {"teamSlug": "platform-admins", "permission": "admin"},
              {"teamSlug": "${{ inputs.team }}", "permission": "push"}
            ]
          repository-topics: '${{ inputs.repo-type }},managed,foundry'
          environments: |
            [
              {
                "name": "production",
                "reviewers": [{"type": "Team", "slug": "platform-admins"}],
                "waitTimer": 30,
                "preventSelfReview": true
              },
              {"name": "staging"}
            ]
          branch-protection-preset: 'strict'

      - name: Notify Team
        run: |
          echo "✅ Repository created: ${{ steps.foundry.outputs.repository-url }}"
          echo "Team ${{ inputs.team }} has push access"
```

### Scheduled Repository Provisioning

Automatically create repositories on a schedule:

```yaml
name: Scheduled Provisioning
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

jobs:
  provision:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        repository:
          - name: 'weekly-report-2024-01'
            description: 'Weekly report repository'
            team: 'analytics'
          - name: 'sprint-42'
            description: 'Sprint 42 planning'
            team: 'developers'

    steps:
      - uses: crmagz/foundry@v1
        with:
          github-token: ${{ secrets.PAT_TOKEN }}
          repository-name: ${{ matrix.repository.name }}
          repository-description: ${{ matrix.repository.description }}
          organization: 'my-org'
          productionalize: 'true'
          team-permissions: |
            [
              {"teamSlug": "${{ matrix.repository.team }}", "permission": "admin"}
            ]
```

---

## Using Outputs

Foundry provides outputs that can be used in subsequent workflow steps:

```yaml
- name: Create Repository
  id: create-repo
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-repo'

- name: Clone Repository
  run: |
    git clone ${{ steps.create-repo.outputs.repository-url }}

- name: Add Issue
  uses: actions/github-script@v7
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      const [owner, repo] = '${{ steps.create-repo.outputs.repository-name }}'.split('/');
      await github.rest.issues.create({
        owner,
        repo,
        title: 'Welcome to your new repository!',
        body: 'This repository was created by Foundry.'
      });

- name: Send Notification
  run: |
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
      -H 'Content-Type: application/json' \
      -d '{
        "text": "New repository created: ${{ steps.create-repo.outputs.repository-url }}",
        "repository_id": "${{ steps.create-repo.outputs.repository-id }}"
      }'
```

### Available Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `repository-url` | HTTPS URL of the created repository | `https://github.com/my-org/my-repo` |
| `repository-name` | Full name in `owner/repo` format | `my-org/my-repo` |
| `repository-id` | Unique numeric repository ID | `123456789` |
| `productionalization-status` | JSON object with productionalization results | `{"teamsConfigured": true, ...}` |

---

## Security Best Practices

### 1. Use Secrets for Sensitive Data

Never hardcode tokens or secrets:

```yaml
# ❌ Bad
- uses: crmagz/foundry@v1
  with:
    github-token: ghp_1234567890abcdef
    repository-secrets: |
      [{"name": "API_KEY", "value": "my-api-key-12345"}]

# ✅ Good
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-secrets: |
      [{"name": "API_KEY", "value": "${{ secrets.API_KEY }}"}]
```

### 2. Limit Token Permissions

Use least-privilege principle:

```yaml
permissions:
  contents: write
  repositories: write
  # Only add what you need
```

### 3. Pin to Specific Versions

For production workflows, pin to specific versions or commit SHAs:

```yaml
# ✅ Good for production
- uses: crmagz/foundry@v1.2.3

# ✅ Best for high-security environments
- uses: crmagz/foundry@abc123def456...
```

### 4. Validate Inputs

Use GitHub Actions input validation:

```yaml
on:
  workflow_dispatch:
    inputs:
      repository-name:
        description: 'Repository name'
        required: true
        pattern: '^[a-z0-9-]+$'  # Only lowercase, numbers, hyphens
```

### 5. Use Environment Protection Rules

Protect sensitive workflows with environment approvals:

```yaml
jobs:
  create-prod-repo:
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      - uses: crmagz/foundry@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository-name: 'critical-service'
          productionalize: 'true'
```

### 6. Review Productionalization Status

Always check the productionalization status output:

```yaml
- name: Create Repository
  id: create
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-repo'
    productionalize: 'true'

- name: Verify Productionalization
  run: |
    echo '${{ steps.create.outputs.productionalization-status }}' | jq .
    # Verify all features were configured successfully
```

---

## Troubleshooting

### Permission Errors

If you see "Resource not accessible by integration":

1. Check workflow permissions:
   ```yaml
   permissions:
     contents: write
     repositories: write
     administration: write
   ```

2. Use a PAT with broader permissions:
   ```yaml
   github-token: ${{ secrets.PAT_TOKEN }}
   ```

### Organization Repository Creation Fails

Ensure:
- Token has `admin:org` scope
- User/token has permission to create repositories in the organization
- Organization name is correct (case-sensitive)

### Productionalization Features Not Applied

- Verify `productionalize: 'true'` is set (string, not boolean)
- Check that teams exist in the organization
- Ensure environments are created before variables/secrets

---

## Next Steps

- 📖 [View all features and examples](./FEATURES.md)
- 🧪 [Test locally with act](./TESTING.md)
- 🔧 [API Reference](./API.md)
