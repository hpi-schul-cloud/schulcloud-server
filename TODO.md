# Technical TODO around Nest Introduction

## SUGGESTED

- filter logs by request with reflect-metadata (see mikroorm em setup)
- disable Document from window
- find a name for base entity id type
- find a name for base entity class
- decide if we want to use our entity id type in all layers (also in dtos etc.)
- use index.ts files to bundle exports - we could use path names for imports then, e.g. @shared/domain
- check how we can implement mandatory/optional fields in dtos
- should we use Expose() as default in dtos?
- in the controller we have to prohibit serialization of properties that have no @EXPOSE
- find the best way ORM entity discovery
- decide where to put domain interfaces (directory)
- how can we log validation errors during development?
- sanitizer
- remove non-node async library
- fix async cleanup & remove timeout in tests
- test object creator for nest entities
- enable log only for failed tests: https://stackoverflow.com/a/61909588
- remove sentry from code
- remove mongoose history (keep one)
- remove custom npm packages (ldap, ...)

## ACCEPTED

- load/perf test

- disable legacy ts support (app, tests)

- fix .env/config for windows

## SELECTED

- test shared / core module 
- async test fixes

- db configuration

  - keep mongoose options as mongo options
  - povider for mikroorm options and db url
  - test db provider
  - entity discovery
  - check indexes in mikroorm: when are they updated?
  - teardown (test, server module, main.ts)
  - replikaset for test module
  - entity discovery

- news

  - uc cleanup: 2auth, visibilities
  - document best practices/layers/orm

- context: user-/request-context (see mikroorm/asynclocalstorage)


## DONE

- check build & start for production with ops
- fix jest, linter, ...
- inject APP_FILTER (exception handler) and APP_INTERCEPTOR (logger), see core module
- custom error handling (log/response), see global-error.filter.ts
- watch docs should hot reload on md file change
- 404 error handling in feathers has to be replaced (tests too). better: have nest before feathers... but seems not to be working
- remove mongoose
- publish documentation, see https://hpi-schul-cloud.github.io/schulcloud-server/overview.html
- fix all tests (nest/legacy)
- remove legacy scripts from package json (except tests) goal: have separated tests (legacy/nest) but only execute the nest app
- using legacy database connection string
- v3 with/-out slash: diffenrent routes should respond with different result (/v3 is a resssource, /v3/ === /v3/index)
- vscode/lauch files: we put only default files into the repo
- naming of dtos and dto-files: api vs domain, we leave out "dto" suffix for simplicity (we know that they are dtos) and instead append a specific suffix:
  e.g.
  api: <PaginationQuery, pagination.query.ts>, <CreatNewsParams, create-news.params.ts>, <NewsResponse, news.response.ts>
  domain: <ICreateNews, create-news.interface.ts>, <News, news.entity.ts>
