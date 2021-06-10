# HPI Schul-Cloud NestJS server

This application extends the existing server-application based on feathers and express by introducing dependency injection supporting unit testing and modularization, the possibility to develop against interfaces, and start implementation of modules using TypeScript.

You find the whole [documentation published as GitHub Page](https://hpi-schul-cloud.github.io/schulcloud-server/additional-documentation/nestjs-application.html)

## How to start the application

Beside existing [scripts](/), for the nestJS application the following scripts have been added. Try not changing the scripts as they should match what NestJS defines by default. Execute `npm run ...`

- `nest:prebuild` remove existing data from previous build
- `nest:build` compile the applications typescript ressources from apps/server to dist folder, keeps legacy js-code where it is
- `nest:build:all` currently executes `nest:build`, could additionaly build static assets
- `nest:doc:serve` builds code documentation and module relations into /documentation folder and serves it on port :8080
- `nest:start` starts the nest application // TODO how?
- `nest:start:dev` run application without build from sources in dev-mode with hot-reload
- `nest:start:debug` run application in dev-mode with hot-reload and debug port opened on port :9229
- `nest:start:prod` start applicaiton in production mode, requires `nest:build` to be executed beforehand

# How to statically check the code

- `nest:lint` run eslint to report linter issues and apply formatting
- `nest:lint:fix` run eslint to report and auto-fix fixable linter issues and apply formatting 

# How to test the application?

- `nest:test` executes all jest  (NestJS) tests, to separate them from existing tests, not use _.test.[ts|js] as filename but instead either \*.spec.ts beside tested files or \*.e2e-spec.ts in test folder
- `nest:test:watch` executes changed tests again on save
- `nest:test:cov` reports coverage results
- `nest:test:debug` executes tests for debugging
- `nest:test:e2e` execute e2e tests only
- `nest:test:spec` execute spec tests (without e2e) only

## Static Code Analysis

Based on `npm run nest:test:all` you can ensure the code is accepted to be merged. This executes all tests, checks for linter issues and code coverage. 

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
