# Technologies

- Use jest as the test framework.
- Use @golevelup/ts-jest for mocks.

# Files

- Unit test files: end with `.spec.ts`
- Test files must be in the same directory as the file under test.

# Code Style

- Always assign function/method call result to a descriptive constant first, then use the constant.
- Always add a blank line between Arrange, Act, and Assert in `it` blocks, and between each `it` block.
- Don't use comments for pointing out Arrange, Act or Assert block.
- Add empty line after several constants.

# Structure

- The outermost `describe` must use the class or file name as description.
- Directly under the outermost describe, add a new describe block for each method or function in the file.
- Under each method/function describe block, add describe blocks for every scenario to be tested.
- In each scenario `describe` block add `setup` arrow function.
- Setup function must return all needed test data and mocks.
- Add empty line before setup return statement.

# Mocks

- Always use `Once` for mocks (e.g., `mockResolvedValueOnce`).
- Use `afterEach(() => { jest.resetAllMocks(); });` once per file to reset mocks after every test.

# Injectables

- For Nest classes (e.g., with `@Injectable()`):
  - In `beforeAll`, use `Test.createTestingModule` and `compile()` to initialize.
  - Store the module in a variable.
  - Module variable must be accessible in `afterAll`.
  - Type of module variable is TestingModule
  - Provide dependencies via `providers` with `useValue`.
  - Use golevelups `createMock` function to provide a value for `useValue`.
  - Declare all injected dependencies as `let <name>` with golevelup `createMock` before `beforeAll`.
  - Type variables as DeepMocked.
  - After `compile()`, assign instances with `module.get(<Name>)` to variables.
  - Add `afterAll` with `await module.close()`.

# Factories

- Always use a Entity/Domain/ValueObject factories to create test data.
- Never create objects as test data directly.
- Castings of objects with the `as` keywoard are forbidden.
- Never call a constructor to create test data.
- Create factory if it's not already existing.
- Factories are created in seperate files.
- Use factories directly.
- Use .build method of factory.
- Don't wrap in extra function.

# Assertions

- In assertions, always use values from the generated test data in `setup`. Never use hardcoded values.

# Scenarios

- Create seperate describe blocks for the resolved and rejected case of a mocked async function.
- Description for successfull case must be `when <method> resolves`
- Description for error case must be `when <method> rejects`
