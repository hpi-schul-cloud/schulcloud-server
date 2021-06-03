# Decisions

## Architecture decisions



### SOLID

Solution: NestJS

### TypeScript

Solution: Use in schulcloud-server, extend strong typing over the api via openAPI and use it in nuxt-client.

### Mikro-ORM

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
- embedded relations (mongodb)

#### Preloading
- nested structures can be preloaded via populate

#### Misc
- use serialized mongo-id
