# Testing Guide

This project uses **Jest** for unit testing with a **Behavior-Driven Development (BDD)** approach.

## Testing Philosophy

- **BDD Style**: Tests are written using `describe`/`it` blocks with clear, readable descriptions
- **Given-When-Then**: Test structure follows the Given-When-Then pattern for clarity
- **Mocked Dependencies**: External dependencies (Octokit, Logger) are mocked for true unit tests
- **Co-located Tests**: Test files live alongside the source code in `__tests__` directories

## Test Structure

```
src/
├── api/
│   └── services/
│       ├── __tests__/
│       │   └── repositoryService.test.ts
│       └── repositoryService.ts
└── util/
    ├── __tests__/
    │   └── inputParser.test.ts
    └── inputParser.ts
```

## Running Tests

### Run all tests
```bash
npm test
# or
make test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
# or
make test
```

### Run tests verbosely
```bash
npm run test:verbose
```

## Writing Tests

### BDD Structure Example

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    describe('when condition is met', () => {
      it('should do expected behavior', () => {
        // Given: Setup test data
        const input = {...};

        // When: Execute the code under test
        const result = service.method(input);

        // Then: Assert expected outcomes
        expect(result).toEqual(expected);
      });
    });
  });
});
```

### Mocking Octokit

```typescript
let mockOctokit: jest.Mocked<Octokit>;

beforeEach(() => {
  mockOctokit = {
    repos: {
      create: jest.fn(),
      // ... other methods
    },
  } as unknown as jest.Mocked<Octokit>;
});

it('should call API correctly', async () => {
  // Setup mock response
  mockOctokit.repos.create.mockResolvedValue({
    data: { id: 123, /* ... */ }
  } as any);

  // Execute and assert
  const result = await service.create(input);
  expect(mockOctokit.repos.create).toHaveBeenCalledWith(expectedParams);
});
```

## Coverage Requirements

The project maintains high coverage standards:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Coverage reports are generated in `coverage/` directory.

## Best Practices

1. **One assertion per test** (when possible)
2. **Clear test names** that describe the behavior
3. **Mock external dependencies** (API clients, file system, etc.)
4. **Test both happy paths and error cases**
5. **Use Given-When-Then comments** for readability
6. **Reset mocks between tests** (automatically done by Jest config)

## CI Integration

Tests run automatically in CI/CD via:
```bash
make check-ci
```

This includes linting, formatting checks, and test execution.
