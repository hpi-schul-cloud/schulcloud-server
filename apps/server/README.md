# HPI Schul-Cloud NestJS server

This application extends the existing server-application based on feathers and express by introducing dependency injection supporting unit testing and modularization, the possibility to develop against interfaces, and start implementation of modules using TypeScript.

You find the whole [documentation published as GitHub Page](https://hpi-schul-cloud.github.io/schulcloud-server/additional-documentation/nestjs-application.html)

# Requirements

* Node.js (see `.nvmrc` for version)
* MongoDB (`4.x`)
* RabbitMQ (configure using `RABBITMQ_URL`, see `default.schema.json`)

## preconditions


1. Have a MongoDB started, run `mongod` 
2. Have some seed data in datase, use `npm run setup` to reset the db and apply seed data
3. Have RabbitMQ started, run `docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3.8.9-management`. This starts RabbitMQ on port 5672 and a web admin console at localhost:15672 (use guest:guest to login). 

## How to start the application

Beside existing [scripts](/), for the nestJS application the following scripts have been added. Try not changing the scripts as they should match what NestJS defines by default. Execute `npm run ...`

- `nest:prebuild` remove existing data from previous build
- `nest:build` compile the applications typescript ressources from apps/server to dist folder, keeps legacy js-code where it is
- `nest:build:all` currently executes `nest:build`, could additionaly build static assets
- `nest:start` starts the nest application on `localhost:3030`
- `nest:start:dev` run application without build from sources in dev-mode with hot-reload
- `nest:start:debug` run application in dev-mode with hot-reload and debug port opened on port :9229
- `nest:start:prod` start applicaiton in production mode, requires `nest:build` to be executed beforehand

### How to build and server the documentation

- `nest:docs:build` builds code documentation and module relations into /documentation folder
- `nest:docs:serve` builds code documentation and module relations into /documentation folder and serves it on port :8080 with hot reload on changes

### How to start the server console

The console offers management capabilities of the application.

- `nest:console` after nest:build in production or
- `nest:console:dev` for development

To run a specific command run `npm run nest:console:dev -- command <param>`. The `--`is required for npm to send params to the console. Use `--help`to get an overview about existing commands.

# How to test the nest-application with jest

 NestJS must not use _.test.[ts|js] as filename but instead either \*.spec.ts for unit-tests beside tested files or \*.e2e-spec.ts in test folder for end-to-end tests. This ensures legacy/feathers/mocha tests can be separated from jest test suites.

The application must pass the following statement which executes separate checks:

- `nest:test` executes all jest (NestJS) tests with coverage and eslint

To test a subset, use

- `nest:test:all` execute unit and e2e tests 
- `nest:test:e2e` execute e2e tests only
- `nest:test:spec` execute unit tests (without e2e) only

- `nest:test:cov` executes all jest tests with coverage check

- `nest:test:watch` executes changed tests again on save
- `nest:test:debug` executes tests with debugging

- `nest:lint` run eslint to report linter issues and apply formatting
- `nest:lint:fix` run eslint to report and auto-fix fixable linter issues and apply formatting 

# Quality gates

With coverage on tests and static code analysis we ensure some quality gates which are all handled by running `nest:test`:

- ESLint with prettier ensures formatting and static code analysis to pass, see `.eslintrc.js` for details.
- Tests ensure functional requirements via unit & e2e tests.
- Coverage on tests ensures a coverage of 80% on NestJS code, see `jest.config.ts` for details. 

Gates are part of pull request checks.

# OpenAPI documentation

The NestJS applicaiton serves a documentation at [:3030/v3/docs](http://localhost:3030/v3/docs). The JSON-representation can be found at `/v3/docs-json` to be used for generating a client application.

Legacy/feathers Swagger UI documentation when running the server locally, it is served at [:3030/docs/](http://localhost:3030/docs/).


# Legacy (feathers) testing with mocha

- `npm run test`
- To run a single test, use `npm run mocha-single -- <path/to/unit.test.js>`.

## How to get full documentation

The documentation is provided by compodoc, run `npm run nest:docs:serve`, check generated compodoc features, custom information can be found in additional information section. Your console will tell you, where it is served.

The updated documentation is published as [GitHub Page](https://hpi-schul-cloud.github.io/schulcloud-server/additional-documentation/nestjs-application.html)

## Content

For further reading, browse `apps/server/doc`.

### NestJS CLI

To use the NestJS CLI, [install the nest cli globally](https://docs.nestjs.com/#installation).

```bash
$ npm i -g @nestjs/cli
```

Then you may use features like `nest g service foo` within of `/apps/server/src`.

### Debugging

There are launch configurations available for VSCode in `.vscode/launch.default.json`

## Tech Stack

Feel free to find related documentation:

- https://nestjs.com/
- https://jestjs.io/
- https://mikro-orm.io/
- https://min.io/
- https://www.rabbitmq.com/ 
