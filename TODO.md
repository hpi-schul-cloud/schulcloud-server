# Technical TODO around Nest Introduction

## SUGGESTED

- disable Document from window
- find a name for base entity id type
- find a name for base entity class
- decide if we want to use our entity id type in all layers (also in dtos etc.)
- use index.ts files to bundle exports - we could use path names for imports then, e.g. @shared/domain
- naming of dtos and dto-files: api vs domain, maybe we can leave out "dto" suffix because we know that they are dtos
  e.g.
  api: <CreatNewsParams, create-news.params.ts>, <NewsResponse, news.response.ts>
  domain: <CreateNews[Vo|Input], create-news.[vo|input].ts>, <News, news.entity.ts>
- check how we can implement mandatory/optional fields in dtos
- should we use Expose() as default in dtos?
- find the best way to configure all entities in the ORM
- how can we log validation errors during development?

## ACCEPTED

- check build & start for production with ops
- load/perf test
- 404 error handling in feathers has to be replaced (tests too). better: have nest before feathers... but seems not to be working
- disable legacy ts support (app, tests)
- fix all tests (nest/legacy)
- fix .env/config for windows
- watch docs should hot reload on md file change

## DONE

- remove legacy scripts from package json (except tests) goal: have separated tests (legacy/nest) but only execute the nest app
- using legacy database connection string
- v3 with/-out slash: diffenrent routes should respond with different result (/v3 is a resssource, /v3/ === /v3/index)
- vscode/lauch files: we put only default files into the repo
