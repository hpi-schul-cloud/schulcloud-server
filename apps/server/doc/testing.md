# Testing

Automated testing is the essential part of the software development process.
Our goal is to test each application layer mostly independent of others.
NestJS:
- provides default tooling (such as test runner that builds an isolated module/application loader)
- provides integration with **Jest** and **Supertest** out of the box
- makes the Nest dependency injection system available in the testing environment for mocking components

## Testing Untilities

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
## Unit Tests vs Integration Tests

In Unit Tests we access directly only the layer which is currently testing. 
Other layers should be mocked or are replaced with default testing implementation.
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
1. Define `MongoMemoryServer`
2. Create `Nest JS testing module`: 
  2.1 with `MikroOrmModule` defining entities which are used in tests.
  2.2 provide the repo which should be tested
3. Get repo, orm and entityManager from testing module

```TypeScript
    beforeAll(async () => {
        mongod = new MongoMemoryServer();                               (1)
        const dbUrl = await mongod.getUri();
        const module: TestingModule = await Test.createTestingModule({  (2)
             imports: [
                 MikroOrmModule.forRoot({                               (2.1)
                     type: 'mongo',
                     clientUrl: dbUrl,
                     entities: [News, CourseNews, ...],
                 }),
              ],
             providers: [NewsRepo],                                     (2.2)                          
      }).compile();
      repo = module.get<NewsRepo>(NewsRepo);                            (3)
      orm = module.get<MikroORM>(MikroORM);
      em = module.get<EntityManager>(EntityManager);
    })
```

#### Post conditions (afterAll)
After all tests are executed close the app and orm to release the resources
```TypeScript
    afterAll(async () => {
        await orm.close();
        await mongod.stop();         
    });
                             
```

### Mapping Tests

Mapping tests are Unit Tests which verify the correct mapping between entities and Dto objects. 
These tests should not have any external dependencies to other layers like database or use cases.


### Use Case Tests

Use case tests are Unit Tests which verify the business logic of the application. 
The database calls are mocked and spyied. So we can check how and with which parameters the repo functions are called.

> Use unit-tests to ensure a use-cases logic matches the given requirements (from a [user-]story). 

> A unit test should cover preconditions, allowed input, the result, and expected exceptions defined by the story, and roughly what happens on malformed input (the execution should stop).

#### Preconditions

1. Create `Nest JS testing module`
2. Use `Repo` as provider reimplement the repo functions with some default implementations
3. Provide other dependencies like `AuthorizationService` and provide default implementation for the function, which are called. 
4. Get repo and uc from testing module

```TypeScript
      const module: TestingModule = await Test.createTestingModule({ (1)
			imports: [LoggerModule],
			providers: [
				NewsUc,
				{
					provide: NewsRepo,                                  (2)
					useValue: {
						save() {
							...
						},
						findAll() {
							...
						},
					},
				},
				{
					provide: AuthorizationService,                      (3)
					useValue: {
						getPermittedEntities(userId, targetModel, permissions) {
							...
						},
					},
				},
			],
		}).compile();

		service = module.get<NewsUc>(NewsUc);                           (4)
		repo = module.get<NewsRepo>(NewsRepo);
```

#### Test
1. Spy repo function which is called inside the tested use case
2. Call the tested function
3. Verify that the repo spy is called with the expected functions
```Typescript
		it('should search for news by empty scope ', async () => {
			const findAllSpy = jest.spyOn(repo, 'findAll');             (1)
			await service.findAllForUser(userId, scope, pagination);    (2)
			const expectedParams = [targets, false, pagination];
			expect(findAllSpy).toHaveBeenCalledWith(...expectedParams); (3)
		});
```

## E2E Tests

Unlike unit testing, which focuses on individual modules, end-to-end testing covers the interaction between classes and
modules at a more aggregate level. Automated end-to-end tests help us to ensure that the overall behavior of the system is correct.

### Controller Tests

To test the setup behind a controller, use e2e-tests to ensure, use cases and repositories below 
are correctly mounted and available at a specific path.

> A controller unit test should ensure it responds with the correct data-format and a referenced use-case is called correctly.

> Authentication and response codes can be unit tested.

> Do not test logic (from the business layer or repository) in e2e-tests, this must be done where the logic is defined within of a unit test. A e2e test should only ensure everything is correctly initialized.

> Do not put logic (beside mapping) inside a controller, use the logic layer instead. Mapping can be unit tested.

#### Preconditions
1. Create Nest testing module
2. Import `ServerModule` as the whole
3. Override authentication using `JwAuthGuard`
3.1 Override authorized user with the mocked user data
4. Override other services for example for authorization
5. Create and initialize the whole Nest Application using `createNestApplication()`
6. Get Orm and Entity Manager from module
```Typescript

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({  (1)
			imports: [ServerModule],                                    (2)
		})
			.overrideGuard(JwtAuthGuard)                                (3)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = {                                        (3.1)
                            userId: '0000d224816abba584714c9c',
                            roles: [],
                            schoolId: '5f2987e020834114b8efd6f8',
                            accountId: '0000d225816abba584714c9d',
                    };                                      
					return true;
				},
			})
			.overrideProvider(AuthorizationService)                     (4)
			.useValue({
				checkEntityPermissions() {},
				getEntityPermissions() {
					return ['NEWS_VIEW', 'NEWS_EDIT'];
				},
			})
			.compile();

		app = module.createNestApplication();                           (5)
		await app.init();
		orm = module.get<MikroORM>(MikroORM);                           (6)
		em = module.get<EntityManager>(EntityManager);
	});


```

#### Clean up
After Each test delete the created data in test to have a clean database for the next test.
```Typescript

	afterEach(async () => {
		await em.nativeDelete(News, {});
	});
```

#### Post Conditions
After all tests are executed close the app and orm to release the resources
```Typescript
	afterAll(async () => {
		await app.close();
		await orm.close();
	});
```

#### Test
An example e2e test uses app http server to call the tested url.
The `request()` function from the `supertest` library simulates HTTP request.
The response can be verified by checking the response code or by applying some verification to the result object.

```Typescript
	describe('GET /news', () => {
      it('should get empty response if there is no news', async () => {
        const response = await request(app.getHttpServer()).get(`/news`).expect(200);
        const {data, total} = response.body as PaginationResponse<NewsResponse[]>;
        expect(total).toBe(0);
        expect(data.length).toBe(0);
      });
    });
```

> Don't forget to test HTTP error codes as well
