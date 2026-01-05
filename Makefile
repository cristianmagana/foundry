.PHONY: help install clean-install clean build package lint lint-fix format format-fix format-check test test-watch test-unit all check-ci pre-commit

# Default target
.DEFAULT_GOAL := help

# Node and npm settings for hermetic builds
NODE_VERSION := 24
NPM_CONFIG_CACHE := $(PWD)/.npm-cache

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
NC := \033[0m # No Color

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Smart install - checks state and installs appropriately
	@echo "$(CYAN)Checking project state...$(NC)"
	@if [ ! -f package-lock.json ]; then \
		echo "No package-lock.json found, performing initial setup..."; \
		rm -rf node_modules dist coverage .npm-cache; \
		npm install --cache=$(NPM_CONFIG_CACHE); \
	elif [ ! -d node_modules ]; then \
		echo "No node_modules found, installing from package-lock.json..."; \
		npm ci --cache=$(NPM_CONFIG_CACHE); \
	else \
		echo "Found package-lock.json and node_modules, using npm ci for clean install..."; \
		npm ci --cache=$(NPM_CONFIG_CACHE); \
	fi
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

clean-install: clean ## Force complete clean and fresh install
	@$(MAKE) install

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	@rm -rf dist
	@rm -rf node_modules
	@rm -rf .npm-cache
	@rm -rf coverage

build: ## Build TypeScript source
	@echo "Building TypeScript..."
	@npm run build

package: build ## Package the action with ncc
	@echo "Packaging action..."
	@npm run package

lint: ## Run ESLint on all TypeScript files
	@echo "$(CYAN)Running linter...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting passed$(NC)"

lint-fix: ## Fix linting issues automatically
	@echo "$(CYAN)Fixing linting issues...$(NC)"
	npm run lint:fix
	@echo "$(GREEN)✓ Linting issues fixed$(NC)"

format: ## Format code with Prettier
	@echo "$(CYAN)Formatting code...$(NC)"
	npm run format
	@echo "$(GREEN)✓ Code formatted$(NC)"

format-fix: ## Alias for format (formats code)
	@$(MAKE) format

format-check: ## Check code formatting
	@echo "$(CYAN)Checking code formatting...$(NC)"
	npm run format:check
	@echo "$(GREEN)✓ Format check passed$(NC)"

test: ## Run tests with coverage
	@echo "$(CYAN)Running tests with coverage...$(NC)"
	@npm run test:coverage
	@echo "$(GREEN)✓ Tests passed$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(NC)"
	@npm run test:watch

test-unit: ## Run unit tests without coverage
	@echo "$(CYAN)Running unit tests...$(NC)"
	@npm run test
	@echo "$(GREEN)✓ Tests passed$(NC)"

pre-commit: ## Run pre-commit checks (lint-staged on staged files only)
	@echo "$(CYAN)Running pre-commit checks...$(NC)"
	@npm run lint
	@npm run format
	@echo "$(GREEN)✓ Pre-commit checks passed$(NC)"

all: install format lint test package ## Run all checks and build

check-ci: format-check lint test package ## CI check (no auto-formatting)
	@echo "All CI checks passed!"

# Deterministic build targets
.PHONY: hermetic-build
hermetic-build: clean install ## Hermetic build from clean state
	@echo "Running hermetic build..."
	@$(MAKE) all

# Local testing targets
.PHONY: test-local test-act test-act-dry test-act-list setup-act

test-local: ## Run local test (requires GITHUB_TOKEN env var and test-payload.json)
	@npm run test:local

test-act: ## Run act workflow (requires Docker and .secrets file)
	@act workflow_dispatch

test-act-dry: ## Dry run act workflow (shows what would run)
	@act workflow_dispatch --dry-run

test-act-list: ## List available act workflows
	@act -l

setup-act: ## Set up act configuration files
	@echo "Setting up act configuration..."
	@if [ ! -f .secrets ]; then \
		cp .secrets.example .secrets; \
		echo "✓ Created .secrets (please edit with your GitHub token)"; \
	else \
		echo "✓ .secrets already exists"; \
	fi
	@if [ ! -f .env.local ]; then \
		cp .env.local.example .env.local; \
		echo "✓ Created .env.local"; \
	else \
		echo "✓ .env.local already exists"; \
	fi
	@echo ""
	@echo "Next steps:"
	@echo "1. Edit .secrets and add your GITHUB_TOKEN"
	@echo "2. Run 'make test-act-dry' to test the configuration"
	@echo "3. Run 'make test-act' to run the workflow"
