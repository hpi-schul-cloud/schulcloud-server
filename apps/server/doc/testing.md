# Testing

Automated testing is the essential part of the software development process.
It improves the code quality and ensure that the code operates correctly especially after refactoring.

## General Test Conventions

### Lean Tests

The tests should be as simple to read and understand as possible. They should be effortless to write and change, in order to not slow down development. Wherever possible:

- avoid complex logic
- cover only one case per test
- only use clearly named and widely used helper functions
- stick to blackbox testing: think about the unit from the outside, not its inner workings.
- its okay to duplicate code for each test

### Naming Convention

When a test fails, the name of the test is the first hint to the developer (or any other person) to what went wrong where. (along with the "describe" blocks the test is in).
Thus, your describe structure and testcase names should be designed to enable a person unfamiliar with the code to identify the problem as fast as possible. It should tell him:

- what component is being tested
- under what condition
- the expected outcome

To facilitate this, your tests should be wrapped in at least two describe levels.

```TypeScript
// Name of the unit under test
describe("Course Service", (() => {
    // a "when..." sentence
	describe("When a student tries to create a course", (() => {
		// a "should..." sentence
        it("should fail", async () => {
            ...
        });
    });
});
```

### Isolation

Each test should be able to run alone, as well as together with any other tests. To ensure this, it is important that the test does not depend on any preexisting data.

- Each test should generate the data it needs, and ensure that its data is deleted afterwards. (this is usually done via mocha's "afterEach" function.
- When you create objects with fields that have to be globally unique, like the account username, you must ensure the name you choose is unique. This can be done by including a timestamp.
- Never use seeddata.

### Test Structure

Your test should be structured in three seperate areas, each distinguished by at least an empty line:

- Arrange - set up your testdata
- Act - call the function you want to test
- Assert - check the result

this is known as the AAA-pattern.

## Testing Samples

### Handling of function return values

When assigning a value to an expect, separate the function call from the expectation to simplify debugging. This later helps when you not know about the return value type or if it's an promise or not. This is good style not only for tests.

```TypeScript
	// doSomethingCrazy : retValue
	it('bad sample', () => {
		expect(doSomethingCrazy(x,y,z)).to...
	})
	it('good sample', () => {
		const result = doSomethingCrazy(x,y,z)
		expect(result).to... // here we can simply debug
	})

```

### Promises and Timouts in tests

When using asynchronous functions and/opr promises, results must be awaited within of an async test function instead of using promise chains. While for expexting error conditions it might be helpful to use catch for extracting a value from an expected error, in every case avoid writing long promise chains.

- Instead of using done callback, use async test functions.
- Use await instead of (long) promise chains
- never manually set a timeout

```TypeScript
	// doSomethingCrazy : Promise<retValue>
	it('bad async sample', async function (done) => {
		this.timeout(10000);
		return doSomethingCrazy(x,y,z).then(result=>{
			expect(result).to...
			done() // expected done
		}).catch(()=>{
			logger.info(`Could not ... ${error}`);
			done() // unexpected done, test will always succeed which is wrong
		})
	})
	it('good async sample', async () => {
		// no timeout set
		const result = await doSomethingCrazy(x,y,z)
		expect(result).to...
	})
```

> Timeouts must not be used, when async handling is correctly defined!

### Expecting errors in tests

When expecting an error, you might take values from an error, test for the error type thrown and must care of promises.

```TypeScript
	// doSomethingCrazy : Promise<retValue>
	it('bad async sample expecting an error', () => {
		expect(doSomethingCrazy(x,y,z)).to...
	})
	it('good async sample expecting an error value', async () => {
		const code = await doSomethingCrazy(x,y,z).catch(err => err.code)
		expect(code).to...
	})
	it('good sample expecting an error type from a sync function', () => {
		expect(() => doSomethingCrazySync(wrong, param)).toThrow(BadRequestException);
	})
	it('good sample expecting an error type from an async function', async () => {
		await expect(doSomethingCrazySync(wrong, param)).rejects.toThrow(BadRequestException);
	})
```

## Testing Utilities

NestJS:

- provides default tooling (such as test runner that builds an isolated module/application loader)
- provides integration with **Jest** and **Supertest** out of the box
- makes the Nest dependency injection system available in the testing environment for mocking components

The `@nestjs/testing.Test` class provides an execution context that mocks the full Nest runtime, but gives
hooks that can help to manage class instances, including mocking and overriding.

The method `Test.createTestingModule()` takes module metadata as argument it returns `TestingModule` instance.
The `TestingModule` instance provides method `compile()` which bootstraps a module with its dependencies.
Every provider can be overwritten with custom provider implementation for testing purposes.

```Typescript
  beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
          controllers: [SampleController],
          providers: [SampleService],
        }).compile();

      sampleService = moduleRef.get<SampleService>(SampleService);
      sampleController = moduleRef.get<SampleController>(CatsController);
    });
```

## Mocking

Using the utilities provided by NestJs, we can easily inject mocks into our testing module. The mocks themselves, we create using a [library](https://www.npmjs.com/package/@golevelup/ts-jest) by @golevelup.

You can create a mock using `createMock<Class>()`. As result you will recieved a `DeepMocked<Class>`

```Typescript
let fut: FeatureUnderTest;
let mockService: DeepMocked<MockService>;

beforeEach(async () => {
	const module = await Test.createTestingModule({
		providers: [
			FeatureUnderTest,
			{
				provide: MockService,
				useValue: createMock<MockService>(),
			},
		],
	}).compile();

	fut = module.get(FeatureUnderTest);
	mockService = module.get(MockService);
});

afterEach(async () => {
	await module.close();
});
```

the resulting mock has all the functions of the original `Class`, replaced with jest spies. This gives you the full intellij features of the original class including code completion and typesavety, combined with all the features of spies.

```Typescript
describe('somefunction', () => {
	describe('when service returns user', () => {
		const setup = () => {
			const resultUser = userFactory.buildWithId();

			mockService.getUser.mockReturnValue(resultUser);

			return { resultUser };
		};

		it('should call service', async () => {
			setup();
			await fut.somefunction();
			expect(mockService.getUser).toHaveBeenCalled();
		});

		it('should return user passed by service', async () => {
			const { resultUser } = setup();
			const result = await fut.somefunction();
			expect(result).toEqual(resultUser);
		});
	});
});

```
## Unit Tests vs Integration Tests

In Unit Tests we access directly only the component which is currently testing.
Any dependencies should be mocked or are replaced with default testing implementation.
Especially the database access and database calls should be mocked.

In contrast to unit tests the integration tests use access to the database and execute
real queries using repositories.

### Repo Tests

For the data access layer, integration tests can be used to check the repositories base functionality against a database.

For Queries care DRY principle, they should be tested very carefully.

> Use a in-memory database for testing to allow parallel test execution and have isolated execution of tests.

> A test must define the before and after state of the data set clearly and cleanup the database after execution to the before state.

> Instead of using predefined data sets, all preconditions should be defined in code through fixtures.

Our repository layer uses `mikro-orm/EntityManager` to execute the queries.
By testing repositories we want to verify the correct behaviour of the repository functions.
It includes verifying expected database state after executed repository function.
Therefore, the `*.repo.integration.spec.js` should be used.

The basic structure of the repo integration test:

#### Preconditions (beforeAll):

1. Create `Nest JS testing module`:
   1.1 with `MongoMemoryDatabaseModule` defining entities which are used in tests. This will wrap MikroOrmModule.forRoot() with running a MongoDB in memory.
   1.2 provide the repo which should be tested
2. Get repo, orm and entityManager from testing module

```TypeScript
	import { MongoMemoryDatabaseModule } from '@src/modules/database';

	let repo: NewsRepo;
	let em: EntityManager;
	let testModule: TestingModule;

    beforeAll(async () => {
    	testModule: TestingModule = await Test.createTestingModule({    (1)
             imports: [
                 	MongoMemoryDatabaseModule.forRoot({                 (1.1)
					entities: [News, CourseNews, ...],
				}),
              ],
             providers: [NewsRepo],                                     (1.2)
      }).compile();
      repo = testModule.get(NewsRepo);                                  (2)
      orm = testModule.get(MikroORM);
      em = testModule.get(EntityManager);
    })
```

#### Post conditions (afterAll), Teardown

After all tests are executed close the app and orm to release the resources by closing the test module.

```TypeScript
    afterAll(async () => {
        await testModule.close();
    });
```

> When Jest reports open handles that not have been closed, ensure all Promises are awaited and all application parts started are correctly closed.

#### Entity Factories

To fill the in-memory-db we use factories. They are located in `\apps\server\src\shared\testing\factory`. If you create a new one, please add it to the index.ts in that folder.

#### Accessing the in-memory-db

While debugging the tests, the URL to the in-memory-db can be found in the `EntityManager` instance of your repo in `em.config.options.clientUrl`.

Copy paste this URL to your DB Tool e.g. MongoDB Compass. You will find a database called 'test' with the data you created for your test.

### Mapping Tests

Mapping tests are Unit Tests which verify the correct mapping between entities and Dto objects.
These tests should not have any external dependencies to other layers like database or use cases.

### Use Case Tests

Since a [usecase](./architecture.md#domain-layer) only contains orchestration, its tests should be decoupled from the components it depends on. We thus use unittests to verify the orchestration where necessary

> All Dependencies should be mocked.

> Use Spies to verify necessary steps, such as authorisation checks.

to be documented

## API Tests

Unlike unit testing, which focuses on individual modules, API testing covers the interaction between classes and
modules at a more aggregate level. Automated API tests help us to ensure that the overall behavior of the system is correct.
API tests should be located in the folder _controller/api-test_ of each module.

### Controller Tests

to be documented

## References

This guide is inspired by https://github.com/goldbergyoni/javascript-testing-best-practices/
