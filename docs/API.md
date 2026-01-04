# Foundry API Reference

Complete reference documentation for all Foundry inputs and outputs.

## Table of Contents

- [Inputs](#inputs)
  - [Core Inputs](#core-inputs)
  - [Productionalization Inputs](#productionalization-inputs)
- [Outputs](#outputs)
- [Input Schemas](#input-schemas)
  - [Team Permissions](#team-permissions-schema)
  - [Environments](#environments-schema)
  - [Environment Variables](#environment-variables-schema)
  - [Repository Secrets](#repository-secrets-schema)
- [Data Types](#data-types)
- [Validation Rules](#validation-rules)
- [Error Codes](#error-codes)

---

## Inputs

### Core Inputs

#### `github-token`

**Required:** Yes
**Type:** String
**Description:** GitHub authentication token with appropriate permissions.

**Permissions required:**
- `repo` - Repository access
- `admin:org` - Organization administration (when creating in org)
- `workflow` - Workflow management (for secrets)

**Example:**
```yaml
github-token: ${{ secrets.GITHUB_TOKEN }}
```

**Security:** Use GitHub secrets to store tokens. Never hardcode tokens in workflows.

---

#### `repository-name`

**Required:** Yes
**Type:** String
**Description:** Name of the repository to create.

**Validation:**
- Must be 1-100 characters
- Can contain alphanumeric characters, hyphens, and underscores
- Cannot start with a hyphen
- Must be unique within the owner's namespace

**Example:**
```yaml
repository-name: 'my-service'
```

---

#### `repository-description`

**Required:** No
**Type:** String
**Default:** `""`
**Description:** Description of the repository.

**Validation:**
- Maximum 350 characters
- Can be empty

**Example:**
```yaml
repository-description: 'A microservice for user authentication'
```

---

#### `repository-private`

**Required:** No
**Type:** String (boolean)
**Default:** `"false"`
**Accepted values:** `"true"`, `"false"`
**Description:** Whether the repository should be private.

**Example:**
```yaml
repository-private: 'true'
```

**Note:** Must be a string (`"true"` or `"false"`), not a boolean.

---

#### `repository-template`

**Required:** No
**Type:** String
**Default:** `""`
**Format:** `owner/repo`
**Description:** Template repository to use as the base.

**Requirements:**
- Template repository must exist
- Must have access to the template
- Format: `organization-or-user/repository-name`

**Example:**
```yaml
repository-template: 'my-org/microservice-template'
```

**Behavior:**
- Copies all files and directories from template
- Preserves template repository structure
- Does not copy workflow runs, issues, or PRs

---

#### `organization`

**Required:** No
**Type:** String
**Default:** `""` (authenticated user's account)
**Description:** Organization to create the repository in.

**Validation:**
- Must be a valid GitHub organization
- Authenticated user must have permission to create repositories in the org

**Example:**
```yaml
organization: 'my-org'
```

**Note:** If omitted, repository is created under the authenticated user's account.

---

#### `auto-init`

**Required:** No
**Type:** String (boolean)
**Default:** `"true"`
**Accepted values:** `"true"`, `"false"`
**Description:** Initialize repository with a README.

**Example:**
```yaml
auto-init: 'true'
```

**Note:** Ignored when using `repository-template` (template initialization takes precedence).

---

#### `gitignore-template`

**Required:** No
**Type:** String
**Default:** `""`
**Description:** Gitignore template to use.

**Common values:**
- `Node` - Node.js
- `Python` - Python
- `Java` - Java
- `Go` - Go
- `Rust` - Rust
- `Ruby` - Ruby

**Example:**
```yaml
gitignore-template: 'Node'
```

**Full list:** See [GitHub's gitignore templates](https://github.com/github/gitignore)

---

#### `license-template`

**Required:** No
**Type:** String
**Default:** `""`
**Description:** License template to use.

**Common values:**
- `mit` - MIT License
- `apache-2.0` - Apache License 2.0
- `gpl-3.0` - GNU GPL v3
- `bsd-3-clause` - BSD 3-Clause
- `mpl-2.0` - Mozilla Public License 2.0

**Example:**
```yaml
license-template: 'mit'
```

**Full list:** See [GitHub's license templates](https://docs.github.com/en/rest/licenses)

---

#### `default-branch`

**Required:** No
**Type:** String
**Default:** `"main"`
**Description:** Default branch name for the repository.

**Common values:**
- `main` - Modern default (recommended)
- `develop` - GitFlow workflow
- `master` - Legacy default
- `trunk` - Monorepo pattern

**Example:**
```yaml
default-branch: 'develop'
```

**Behavior:**
- For new repositories: Sets the default branch during creation
- For template repositories: Renames the template's default branch after creation
- Branch is created automatically when `auto-init: 'true'`

**Note:** The branch name must be a valid Git branch name (alphanumeric, hyphens, underscores, slashes).

---

### Productionalization Inputs

#### `productionalize`

**Required:** No
**Type:** String (boolean)
**Default:** `"false"`
**Accepted values:** `"true"`, `"false"`
**Description:** Enable productionalization features.

**When enabled, allows configuration of:**
- Team permissions
- Environments
- Environment variables
- Branch protection
- Repository secrets
- Repository topics

**Example:**
```yaml
productionalize: 'true'
```

**Note:** Must be set to `"true"` (string) to enable productionalization features.

---

#### `team-permissions`

**Required:** No (requires `productionalize: 'true'`)
**Type:** JSON Array
**Default:** `[]`
**Description:** Array of team permission configurations.

**Schema:** See [Team Permissions Schema](#team-permissions-schema)

**Example:**
```yaml
team-permissions: |
  [
    {"teamSlug": "platform-admins", "permission": "admin"},
    {"teamSlug": "developers", "permission": "push"},
    {"teamSlug": "contractors", "permission": "pull"}
  ]
```

**Available permissions:**
- `admin` - Full access
- `maintain` - Maintain access
- `push` - Read/write access
- `triage` - Triage access
- `pull` - Read-only access

---

#### `repository-topics`

**Required:** No (requires `productionalize: 'true'`)
**Type:** String (comma-separated) or JSON Array
**Default:** `""`
**Description:** Topics to add/merge with existing repository topics.

**Format 1: Comma-separated**
```yaml
repository-topics: 'nodejs,microservice,api,production'
```

**Format 2: JSON array**
```yaml
repository-topics: |
  ["nodejs", "microservice", "api", "production"]
```

**Behavior:**
- Topics are merged with existing topics
- Duplicates are automatically removed
- Maximum 20 topics per repository
- Topics must be lowercase, alphanumeric, or hyphens

---

#### `environments`

**Required:** No (requires `productionalize: 'true'`)
**Type:** JSON Array
**Default:** `[]`
**Description:** Array of deployment environment configurations.

**Schema:** See [Environments Schema](#environments-schema)

**Example:**
```yaml
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

---

#### `environment-variables`

**Required:** No (requires `productionalize: 'true'`)
**Type:** JSON Array
**Default:** `[]`
**Description:** Environment-specific variables configuration.

**Schema:** See [Environment Variables Schema](#environment-variables-schema)

**Example:**
```yaml
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
        {"name": "apiBaseUrl", "value": "https://staging-api.example.com"}
      ]
    }
  ]
```

**Auto-normalization:**
Variable names are automatically converted to `UPPER_SNAKE_CASE`:
- `nodeEnv` → `NODE_ENV`
- `apiBaseUrl` → `API_BASE_URL`
- `logLevel` → `LOG_LEVEL`

---

#### `branch-protection-preset`

**Required:** No (requires `productionalize: 'true'`)
**Type:** String
**Default:** `""`
**Accepted values:** `"strict"`, `"moderate"`, `"minimal"`
**Description:** Preset branch protection configuration.

**Presets:**

**`strict`** - Maximum protection:
- Require 2 pull request approvals
- Dismiss stale reviews
- Require code owner review
- Require status checks to pass
- Require branches to be up to date
- Require conversation resolution
- Require signed commits
- Restrict pushes
- Lock branch

**`moderate`** - Balanced protection:
- Require 1 pull request approval
- Require status checks to pass
- Require conversation resolution
- Lock branch

**`minimal`** - Lightweight protection:
- Require pull request before merging
- Lock branch

**Example:**
```yaml
branch-protection-preset: 'strict'
branch-protection-target-branch: 'main'
```

---

#### `branch-protection-target-branch`

**Required:** No
**Type:** String
**Default:** `"master"`
**Description:** Target branch for protection rules.

**Example:**
```yaml
branch-protection-target-branch: 'main'
```

**Note:** Branch must exist before protection can be applied.

---

#### `repository-secrets`

**Required:** No (requires `productionalize: 'true'`)
**Type:** JSON Array
**Default:** `[]`
**Description:** Array of encrypted repository secrets.

**Schema:** See [Repository Secrets Schema](#repository-secrets-schema)

**Example:**
```yaml
repository-secrets: |
  [
    {"name": "NPM_TOKEN", "value": "${{ secrets.NPM_TOKEN }}"},
    {"name": "AWS_ACCESS_KEY_ID", "value": "${{ secrets.AWS_ACCESS_KEY_ID }}"},
    {"name": "AWS_SECRET_ACCESS_KEY", "value": "${{ secrets.AWS_SECRET_ACCESS_KEY }}"}
  ]
```

**Security:**
- Secrets are encrypted using libsodium (sealed boxes)
- Encrypted with repository's public key
- Secrets are hidden in GitHub UI and logs

---

## Outputs

### `repository-url`

**Type:** String
**Description:** HTTPS URL of the created repository.

**Example:**
```
https://github.com/my-org/my-repo
```

**Usage:**
```yaml
- name: Clone Repository
  run: git clone ${{ steps.foundry.outputs.repository-url }}
```

---

### `repository-name`

**Type:** String
**Format:** `owner/repo`
**Description:** Full name of the created repository.

**Example:**
```
my-org/my-repo
```

**Usage:**
```yaml
- name: Use Repository Name
  run: |
    echo "Created: ${{ steps.foundry.outputs.repository-name }}"
```

---

### `repository-id`

**Type:** String (numeric)
**Description:** Unique ID of the created repository.

**Example:**
```
123456789
```

**Usage:**
```yaml
- name: Store Repository ID
  run: |
    echo "REPO_ID=${{ steps.foundry.outputs.repository-id }}" >> $GITHUB_ENV
```

---

### `productionalization-status`

**Type:** JSON String
**Description:** Detailed productionalization results.

**Schema:**
```json
{
  "teamsConfigured": true,
  "environmentsCreated": 2,
  "variablesSet": 6,
  "secretsSet": 3,
  "branchProtectionApplied": true,
  "topicsAdded": 4
}
```

**Usage:**
```yaml
- name: Check Productionalization
  run: |
    echo '${{ steps.foundry.outputs.productionalization-status }}' | jq .
```

---

## Input Schemas

### Team Permissions Schema

**JSON Array of Objects**

```typescript
[
  {
    "teamSlug": string,      // Required: Team slug (not display name)
    "permission": string     // Required: "admin" | "maintain" | "push" | "triage" | "pull"
  }
]
```

**Example:**
```json
[
  {"teamSlug": "platform-admins", "permission": "admin"},
  {"teamSlug": "developers", "permission": "push"},
  {"teamSlug": "qa-team", "permission": "triage"},
  {"teamSlug": "external-contractors", "permission": "pull"}
]
```

**Validation:**
- `teamSlug`: Must be existing team in organization
- `permission`: Must be one of the allowed values

---

### Environments Schema

**JSON Array of Objects**

```typescript
[
  {
    "name": string,                    // Required: Environment name
    "reviewers"?: [                    // Optional: Required reviewers
      {
        "type": "Team" | "User",       // Required: Reviewer type
        "slug": string                 // Required: Team slug or username
      }
    ],
    "waitTimer"?: number,              // Optional: Wait time in minutes (0-43200)
    "preventSelfReview"?: boolean      // Optional: Prevent self-approval
  }
]
```

**Example:**
```json
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

**Validation:**
- `name`: Required, must be unique
- `reviewers.type`: Must be `"Team"` or `"User"`
- `waitTimer`: 0-43,200 minutes (30 days max)
- `preventSelfReview`: Requires `reviewers` to be set

---

### Environment Variables Schema

**JSON Array of Objects**

```typescript
[
  {
    "environmentName": string,         // Required: Environment name (must exist)
    "variables": [                     // Required: Array of variables
      {
        "name": string,                // Required: Variable name (auto-normalized to UPPER_SNAKE_CASE)
        "value": string                // Required: Variable value
      }
    ]
  }
]
```

**Example:**
```json
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

**Auto-normalization:**
Variable names are converted to `UPPER_SNAKE_CASE`:
- `camelCase` → `CAMEL_CASE`
- `PascalCase` → `PASCAL_CASE`
- `snake_case` → `SNAKE_CASE`
- `kebab-case` → `KEBAB_CASE`

**Validation:**
- `environmentName`: Must match an existing environment
- `variables`: Must be non-empty array
- `name`: Must be valid environment variable name
- `value`: Can be any string (including empty)

---

### Repository Secrets Schema

**JSON Array of Objects**

```typescript
[
  {
    "name": string,                    // Required: Secret name (UPPER_CASE recommended)
    "value": string                    // Required: Secret value (will be encrypted)
  }
]
```

**Example:**
```json
[
  {"name": "NPM_TOKEN", "value": "npm_abc123def456"},
  {"name": "AWS_ACCESS_KEY_ID", "value": "AKIAIOSFODNN7EXAMPLE"},
  {"name": "AWS_SECRET_ACCESS_KEY", "value": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"},
  {"name": "DOCKER_USERNAME", "value": "myusername"},
  {"name": "DOCKER_PASSWORD", "value": "mypassword"}
]
```

**Best practices:**
- Use `UPPER_SNAKE_CASE` for secret names
- Pass secrets from workflow secrets: `"${{ secrets.SECRET_NAME }}"`
- Never hardcode secret values in workflow files

**Encryption:**
Secrets are encrypted using:
1. Fetch repository's public key
2. Encrypt using libsodium sealed box (X25519 + XSalsa20-Poly1305)
3. Base64 encode encrypted value
4. Upload via GitHub API

---

## Data Types

### String Boolean

Many inputs accept string booleans:

**Accepted values:**
- `"true"` (lowercase string)
- `"false"` (lowercase string)

**Invalid values:**
- `true` (boolean - YAML will convert this)
- `false` (boolean - YAML will convert this)
- `"True"` (wrong case)
- `"yes"` / `"no"`
- `"1"` / `"0"`

**Why strings?**
GitHub Actions inputs are always strings. Using string literals ensures consistent behavior.

**Example:**
```yaml
# ✅ Correct
repository-private: 'true'
productionalize: 'true'
auto-init: 'false'

# ❌ Incorrect (but often works due to YAML conversion)
repository-private: true
productionalize: false
```

---

## Validation Rules

### Repository Name

- **Pattern:** `^[a-zA-Z0-9_-]+$`
- **Length:** 1-100 characters
- **Restrictions:**
  - Cannot start with hyphen
  - Cannot be `.` or `..`
  - Must be unique within owner namespace

### Default Branch Name

- **Pattern:** Valid Git branch name
- **Allowed characters:** Alphanumeric, hyphens, underscores, forward slashes
- **Length:** 1-255 characters
- **Restrictions:**
  - Cannot start or end with `/`
  - Cannot contain `..`
  - Cannot contain consecutive slashes `//`
  - Cannot contain special characters like `~`, `^`, `:`, `?`, `*`, `[`

### Team Slug

- Must be existing team in organization
- Case-sensitive
- Use slug, not display name (e.g., `platform-team`, not `Platform Team`)

### Environment Name

- **Pattern:** `^[a-zA-Z0-9_-]+$`
- **Length:** 1-255 characters
- **Reserved names:** None
- **Case-sensitive:** Yes

### Variable Name

- Auto-normalized to `UPPER_SNAKE_CASE`
- Must be valid environment variable name
- No length limit

### Secret Name

- **Pattern:** `^[A-Z0-9_]+$` (recommended)
- **Length:** No limit
- **Case-sensitive:** Yes
- **Reserved prefixes:** `GITHUB_` (reserved by GitHub)

### Wait Timer

- **Range:** 0-43,200 minutes (0 minutes to 30 days)
- **Type:** Integer
- **Default:** 0 (no wait)

---

## Error Codes

### Common Errors

#### `INVALID_TOKEN`
**Message:** "Invalid GitHub token"
**Cause:** Token is malformed, expired, or lacks required permissions
**Solution:** Verify token has `repo` and `admin:org` scopes

#### `REPOSITORY_EXISTS`
**Message:** "Repository already exists"
**Cause:** Repository with the same name exists in the namespace
**Solution:** Use a different repository name or delete existing repository

#### `TEMPLATE_NOT_FOUND`
**Message:** "Template repository not found"
**Cause:** Template repository doesn't exist or is inaccessible
**Solution:** Verify template name and access permissions

#### `TEAM_NOT_FOUND`
**Message:** "Team {slug} not found"
**Cause:** Team doesn't exist in the organization
**Solution:** Verify team slug and organization

#### `ENVIRONMENT_NOT_FOUND`
**Message:** "Environment {name} does not exist"
**Cause:** Attempting to set variables for non-existent environment
**Solution:** Create environment first in `environments` input

#### `INVALID_PERMISSION`
**Message:** "Invalid permission level"
**Cause:** Permission is not one of: admin, maintain, push, triage, pull
**Solution:** Use valid permission level

#### `INVALID_REVIEWER_TYPE`
**Message:** "Reviewer type must be 'Team' or 'User'"
**Cause:** Reviewer type is not capitalized correctly
**Solution:** Use `"Team"` or `"User"` (capitalize first letter)

#### `WAIT_TIMER_OUT_OF_RANGE`
**Message:** "Wait timer must be between 0 and 43200 minutes"
**Cause:** Wait timer exceeds maximum of 30 days
**Solution:** Reduce wait timer value

#### `INVALID_BRANCH_PROTECTION_PRESET`
**Message:** "Invalid branch protection preset"
**Cause:** Preset is not one of: strict, moderate, minimal
**Solution:** Use valid preset name

#### `ENCRYPTION_FAILED`
**Message:** "Failed to encrypt secret"
**Cause:** Error during libsodium encryption
**Solution:** Check secret value and repository public key

---

## Next Steps

- 📖 [View features and examples](./FEATURES.md)
- 🏪 [Use from GitHub Marketplace](./MARKETPLACE.md)
- 🧪 [Test locally with act](./TESTING.md)
