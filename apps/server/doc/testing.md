# Testing

Automated testing is the essential part of the software development process.
Our goal is to test each application layer mostly independent of others. 

## Unit Tests vs Integration Tests

In Unit Tests we access directly only the layer which is currently testing. 
Other layers should be mocked or are replaced with default testing implementation.
Especially the database access and database calls should be mocked.

In contrast to unit tests the integration tests use access to the database and execute
real queries using repositories.

### Repo Tests

Our repository layer uses `mikro-orm/EntityManager` to execute the queries. 
By testing repositories we want to verify the correct behaviour of the repository functions.
It includes verifying expected database state after executed repository function. 
Therefore, the `*.repo.integration.spec.js` should be used. 

The basic structure of the repo integration test:

#### Pre conditions (beforeAll): 
1. Define `MongoMemoryServer`
2. Create `Nest JS testing module`: 
  2.1 with `MikroOrmModule` defining entities which are used in tests.
  2.2 provide the repo which should be tested
3. Get repo, orm and entityManager from testing module

```TypeScript
1       mongod = new MongoMemoryServer();                               (1)
2       const dbUrl = await mongod.getUri();
3       const module: TestingModule = await Test.createTestingModule({  (2)
4            imports: [
5                MikroOrmModule.forRoot({                               (2.1)
6                    type: 'mongo',
7                    clientUrl: dbUrl,
8                    entities: [News, CourseNews, ...],
9                }),
10            ],
11           providers: [NewsRepo],                                     (2.2)                          
12    }).compile();
13    repo = module.get<NewsRepo>(NewsRepo);                            (3)
14    orm = module.get<MikroORM>(MikroORM);
15    em = module.get<EntityManager>(EntityManager);
```

#### Post conditions (afterAll)
Close orm and memory server
```TypeScript
1   await orm.close();
2   await mongod.stop();                          
```

### Mapping Tests

Mapping tests are Unit Tests which verify the correct mapping between entities and Dto objects. 
These tests should not have any external dependencies to other layers like database or use cases.


### Use Case Tests

Use case tests are Unit Tests which verify the business logic of the application. 
The database calls are mocked and spyied. So we can check how and with which parameters the repo functions are called.


#### Preconditions

1. Create `Nest JS testing module`
2. Use `Repo` as provider reimplement the repo functions with some default implementations
3. Provide other dependencies like `AuthorizationService` and provide default implementation for the function, which are called. 
4. Get repo and uc from testing module

```TypeScript
1        const module: TestingModule = await Test.createTestingModule({ (1)
2			imports: [LoggerModule],
3			providers: [
4				NewsUc,
5				{
6					provide: NewsRepo,                                  (2)
7					useValue: {
8						save() {
9							...
10						},
11						findAll() {
12							...
13						},
14					},
15				},
16				{
17					provide: AuthorizationService,                      (3)
18					useValue: {
19						getPermittedEntities(userId, targetModel, permissions) {
20							...
21						},
22					},
23				},
24			],
25		}).compile();
26
27		service = module.get<NewsUc>(NewsUc);                           (4)
28		repo = module.get<NewsRepo>(NewsRepo);
```

#### Test
1. Spy repo function which is called inside the tested use case
2. Call the tested function
3. Verify that the repo spy is called with the expected functions
```Typescript
1		it('should search for news by empty scope ', async () => {
2			const findAllSpy = jest.spyOn(repo, 'findAll');             (1)
3			await service.findAllForUser(userId, scope, pagination);    (2)
4			const expectedParams = [targets, false, pagination];
5			expect(findAllSpy).toHaveBeenCalledWith(...expectedParams); (3)
6		});
```

## E2E Tests

### Controller Tests