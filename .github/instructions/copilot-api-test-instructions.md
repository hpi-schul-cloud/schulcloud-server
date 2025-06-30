# Technologies

- Use jest as the test framework.
- Use @golevelup/ts-jest for mocks.

# Files

- API test files: end with `.api.spec.ts`
- Add test file to test or api-test folder.

# Code Style

- Always assign function/method call result to a descriptive constant first, then use the constant.
- Always add a blank line between Arrange, Act, and Assert in `it` blocks, and between each `it` block.
- Don't use comments for pointing out Arrange, Act or Assert block.
- Add empty line after several constants.

# Structure

- Add `describe`-block with description `<module_name> Controller (API)`
- Directly under the outermost describe, add a new describe block for each method.
- Under each method/function describe block, add describe blocks for every scenario to be tested.
- In each scenario `describe` block add `setup` arrow function.
- Setup function must return all needed test data and mocks.
- Add empty line before setup return statement.

# Test suite setup

- Add this code to the outermost describe block:

  ```ts
  let app: INestApplication;
  let em: EntityManager;
  let testApiClient: TestApiClient;

  beforeAll(async () => {
  	const moduleFixture = await Test.createTestingModule({
  		imports: [ServerTestModule],
  	}).compile();

  	app = moduleFixture.createNestApplication();
  	await app.init();
  	em = app.get(EntityManager);
  	testApiClient = new TestApiClient(app, '<api_endpoint>');
  });

  beforeEach(async () => {
  	await cleanupCollections(em);
  });

  afterAll(async () => {
  	await app.close();
  });
  ```

# Mocks

- If FilesStorageClientAdapterService is a dependency add a mock

# Assertions

- In assertions, always use values from the generated test data in `setup`. Never use hardcoded values.

# Scenarios

- Add a scenario when the user isn't logged in
- Add a scenario when params are not valid
- Add a scenario when user isn't authorized
- Add a successfull scenario
  - Add const loggedInClient by calling login with account on testapiclient.
  - Add validation of operation on database level to assert
