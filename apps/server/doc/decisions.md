# Decisions

## Architecture decisions



### SOLID

Solution: NestJS

### TypeScript

Solution: Use in schulcloud-server, extend strong typing over the api via openAPI and use it in nuxt-client.

#### Strict settings: Property Initialization

Due to different ways of how instances are generated while we focus on having strict settings enabled by default, we have the following exceptions for [strict property initialization](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization) defined:

- reponse dtos (generated in controllers by mappers based on entities) will get constructors added for setting all or at least all required properties via constructors
- request dtos will use ! on properties ang do not get constructors added. The validity must be defined by and match with class validator decorators on properties. The application then will generate valid instances on input data. 
- for entity id and _id the developer must know if the values are present or not depending on persistence state of an entity
- all other classes should use complete constructors, and avoid use of ! on properties, especially all providers, and entities for application use and testing
- legacy code might have got some ! added which should be removed and get constructors added correctly.

### Mikro-ORM

#### Typescript Support
- strong typed entities
- provide meta data through:
  - classes
  - decorators (on classes, properties)
#### MongoDB Support
- full Support for MongoDB
- (as opposed to e.g. TypeORM, Prisma)

#### Unit of Work
- implicit transactions
- managed entities / references
- collect changes
- em.flush()

#### Identity Map
- always get the same instance of one entity
- good for:
  - optimizations
  - caching
  - comparison by identity
- request scope in web applications

#### Database agnostic
- can be used with different databases (SQL/NoSQL)

#### Relation mapping
- 1:n, 1:1, m:n
- foreign collection relations
- embedded relations (MongoDB)

#### Preloading
- nested structures can be preloaded via populate

#### Misc
- use serialized mongo-id

#### Issues
- no join queries in MongoDB
- no populate in queries over relations
