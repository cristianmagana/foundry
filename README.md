# Foundry

**Deterministic repository creation for platform teams.**

Foundry is a GitHub Action that provides automated, reproducible repository creation with optional productionalization features. Built with Octokit, it enables platform engineering teams to standardize repository setup across organizations.

## What is Foundry?

Foundry automates the entire repository creation lifecycle:

- 🏗️ **Repository Creation** - Create repositories from scratch or templates
- 🔐 **Team Access Control** - Automatically assign team permissions
- 🌍 **Environment Management** - Configure deployment environments with protection rules
- 🔧 **Configuration** - Set environment variables with auto-normalization
- 🛡️ **Security** - Apply branch protection and manage encrypted secrets
- 🏷️ **Organization** - Add topics for discoverability and classification

### Key Benefits

- **Consistency** - Every repository follows the same standards
- **Speed** - Seconds instead of manual configuration
- **Compliance** - Enforce security and access policies automatically
- **Self-Service** - Enable teams to create production-ready repositories on-demand

---

## Documentation

📚 **Complete guides and references:**

- **[Features Guide](./docs/FEATURES.md)** - All features with comprehensive examples
- **[Marketplace Usage](./docs/MARKETPLACE.md)** - How to use Foundry from GitHub Marketplace
- **[Local Testing](./docs/TESTING.md)** - Test locally with act before deployment
- **[API Reference](./docs/API.md)** - Complete input/output documentation

---

## Quick Start

### Basic Repository Creation

```yaml
name: Create Repository
on: workflow_dispatch

jobs:
  create:
    runs-on: ubuntu-latest
    steps:
      - uses: crmagz/foundry@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          repository-name: 'my-new-repo'
          repository-description: 'Created with Foundry'
          repository-private: 'false'
```

### Production-Ready Repository

```yaml
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-service'
    organization: 'my-org'
    repository-private: 'true'

    # Enable productionalization
    productionalize: 'true'

    # Configure teams
    team-permissions: |
      [
        {"teamSlug": "platform-admins", "permission": "admin"},
        {"teamSlug": "developers", "permission": "push"}
      ]

    # Create environments
    environments: |
      [
        {"name": "production", "reviewers": [{"type": "Team", "slug": "platform-admins"}]},
        {"name": "staging"}
      ]

    # Set environment variables
    environment-variables: |
      [
        {
          "environmentName": "production",
          "variables": [
            {"name": "nodeEnv", "value": "production"},
            {"name": "logLevel", "value": "error"}
          ]
        }
      ]

    # Apply branch protection
    branch-protection-preset: 'strict'

    # Add secrets
    repository-secrets: |
      [
        {"name": "NPM_TOKEN", "value": "${{ secrets.NPM_TOKEN }}"}
      ]
```

See [Features Guide](./docs/FEATURES.md) for more examples and detailed configuration options.

---

## Prerequisites

To develop or test Foundry locally:

- **Node.js** 24 or higher (LTS)
- **npm** 9 or higher
- **Make** (for build automation)
- **Docker** (required for local testing with act)
- **Git** 2.0 or higher

To use Foundry as a GitHub Action:

- **GitHub Token** with appropriate permissions:
  - `repo` - Repository access
  - `admin:org` - Organization administration (for productionalization)
  - `workflow` - Workflow management (for secrets)

---

## Development

### Installation

Install dependencies:

```bash
make install
```

Or using npm:

```bash
npm install
```

### Building

Build the action for distribution:

```bash
make build
```

Or using npm:

```bash
npm run build
```

This compiles TypeScript and packages everything into `dist/index.js`.

### Testing

Run the test suite:

```bash
make test
```

Or using npm:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Code Quality

Format code:

```bash
make format
```

Lint code:

```bash
make lint
```

Run all checks (format + lint + build + test):

```bash
make all
```

### Local Testing

Test the action locally before pushing:

**Method 1: Unit Tests**
```bash
npm test
```

**Method 2: Act (GitHub Actions locally)**
```bash
# Install act (one-time setup)
brew install act  # macOS
# or see https://github.com/nektos/act#installation

# Configure secrets
echo "GITHUB_TOKEN=your_token" > .secrets

# Run the test workflow
act workflow_dispatch -W .github/workflows/test-local.yml --secret-file .secrets
```

See [Local Testing Guide](./docs/TESTING.md) for comprehensive act testing instructions.

---

## Project Structure

```
foundry/
├── .github/
│   └── workflows/           # GitHub Actions workflows
├── docs/                    # Documentation
│   ├── FEATURES.md         # Feature guide with examples
│   ├── MARKETPLACE.md      # Marketplace usage guide
│   ├── TESTING.md          # Local testing guide
│   └── API.md              # API reference
├── src/
│   ├── api/                # GitHub API integration
│   │   ├── services/       # Repository and productionalization services
│   │   └── client/         # Octokit client wrapper
│   ├── config/             # Configuration management
│   ├── util/               # Utilities (parsing, encryption, logging)
│   ├── main.ts             # GitHub Action entrypoint
│   └── main-local.ts       # Local testing entrypoint
├── dist/                   # Compiled JavaScript (generated)
├── action.yml              # Action metadata
├── jest.config.js          # Jest configuration
├── Makefile                # Build automation
└── package.json            # Dependencies and scripts
```

---

## Inputs

### Core Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github-token` | Yes | - | GitHub authentication token |
| `repository-name` | Yes | - | Repository name to create |
| `repository-description` | No | `''` | Repository description |
| `repository-private` | No | `'false'` | Make repository private |
| `repository-template` | No | `''` | Template repository (owner/repo) |
| `organization` | No | `''` | Organization to create repository in |
| `auto-init` | No | `'true'` | Initialize with README |
| `gitignore-template` | No | `''` | Gitignore template name |
| `license-template` | No | `''` | License template name |
| `default-branch` | No | `'main'` | Default branch name |

### Productionalization Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `productionalize` | No | `'false'` | Enable productionalization features |
| `team-permissions` | No | `[]` | Team access configuration (JSON) |
| `repository-topics` | No | `''` | Topics for organization |
| `environments` | No | `[]` | Deployment environments (JSON) |
| `environment-variables` | No | `[]` | Environment variables (JSON) |
| `branch-protection-preset` | No | `''` | Protection preset: strict/moderate/minimal |
| `branch-protection-target-branch` | No | `'master'` | Branch to protect |
| `repository-secrets` | No | `[]` | Repository secrets (JSON) |

See [API Reference](./docs/API.md) for complete input schemas and validation rules.

---

## Outputs

| Output | Description |
|--------|-------------|
| `repository-url` | HTTPS URL of created repository |
| `repository-name` | Full name (owner/repo) |
| `repository-id` | Unique repository ID |
| `productionalization-status` | JSON object with productionalization results |

### Using Outputs

```yaml
- name: Create Repository
  id: create
  uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'my-repo'

- name: Use Outputs
  run: |
    echo "Repository URL: ${{ steps.create.outputs.repository-url }}"
    echo "Repository Name: ${{ steps.create.outputs.repository-name }}"
    echo "Repository ID: ${{ steps.create.outputs.repository-id }}"
```

---

## Examples

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

### Add Team Permissions

```yaml
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'team-repo'
    organization: 'my-org'
    productionalize: 'true'
    team-permissions: |
      [
        {"teamSlug": "platform-admins", "permission": "admin"},
        {"teamSlug": "developers", "permission": "push"},
        {"teamSlug": "contractors", "permission": "pull"}
      ]
```

### Configure Environments

```yaml
- uses: crmagz/foundry@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repository-name: 'service'
    productionalize: 'true'
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
    environment-variables: |
      [
        {
          "environmentName": "production",
          "variables": [
            {"name": "nodeEnv", "value": "production"},
            {"name": "logLevel", "value": "error"}
          ]
        }
      ]
```

See [Features Guide](./docs/FEATURES.md) for complete examples and use cases.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Run tests**: `make test`
5. **Run all checks**: `make all`
6. **Commit your changes**: `git commit -m "Add my feature"`
7. **Push to branch**: `git push origin feature/my-feature`
8. **Open a Pull Request**

### Development Workflow

```bash
# Install dependencies
make install

# Make your changes
# ...

# Format and lint
make format
make lint

# Run tests
make test

# Build
make build

# Run all checks before committing
make all
```

### Pre-commit Hooks

The repository uses Husky for pre-commit hooks that automatically run formatting and linting:

```bash
# Hooks are installed automatically with npm install
npm install

# Manually trigger pre-commit checks
npm run prepare
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- 📖 **Documentation**: [docs/](./docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/crmagz/foundry/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/crmagz/foundry/discussions)

---

## Acknowledgments

Built with:
- [Octokit](https://github.com/octokit/octokit.js) - GitHub API client
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Jest](https://jestjs.io/) - Testing framework
- [libsodium](https://github.com/jedisct1/libsodium.js) - Cryptography for secrets
- [GTS](https://github.com/google/gts) - Google TypeScript Style
