# HPI Schul-Cloud NestJS server

This application extends the existing server-application based on feathers and express by introducing dependency injection supporting unit testing and modularization, the possibility to develop against interfaces, and start implementation of modules using TypeScript.

## How to start the application

Beside existing [scripts](/), for the nestJS application the following scripts have been added. Try not changing the scripts as they should match what NestJS defines by default. Execute `npm run ...`

- `nest:prebuild` prebuild nest ressources
- `nest:build` compile the applications typescript ressources from apps/server to dist folder, keeps legacy js-code where it is
- `nest:build:all` currently executes `nest:build`, could additionaly build static assets
- `nest:clean` removes the dist folder
- `nest:doc:serve` builds code documentation and module relations into  /documentation folder and serves it on port :8080
- `nest:start` starts the nest application // TODO how?
- `nest:start:dev` run application without build from sources in dev-mode with hot-reload
- `nest:start:debug` run application in dev-mode with hot-reload and debug port opened on port :9229
- `nest:start:prod` start applicaiton in  production mode, requires `nest:build` to be executed beforehand

# How to statically check the code

- `nest:format` run prettier to fix formatting issues
- `nest:lint` run eslint to fix linter issues

# How to test the application?

- `nest:test` executes jest tests, to separate them from existing tests, not use *.test.[ts|js] as filename but instead either *.spec.ts beside providers or *.e2e-spec.ts in test folders
- `nest:test:watch` executes changed tests again on save
- `nest:test:cov` reports coverage results 
- `nest:test:debug` executes tests for debugging
- `nest:test:e2e` beside unit tests on providers which are placed beside the providers (executed by statements above), e2e tests can be added in test folder

## How to get full documentation

The documentation is provided by compodoc, run `npm run nest:dev:serve`, check generated compodoc features, custom information can be found in additional information section. Your console will tell you, where it is served.

## Content of apps/server/doc

- Naming Conventions
- Application Layers

## Development

### NestJS CLI

To use the NestJS CLI, [install the nest cli globally](https://docs.nestjs.com/#installation). 

```bash
$ npm i -g @nestjs/cli
```
Then you may use features like `nest g service foo` within of `/apps/server/src`.

### Debugging

There are launch configurations available for VSCode in `.vscode/launch.default.json`
