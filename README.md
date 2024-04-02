# Schul-Cloud Server

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=hpi-schul-cloud_schulcloud-server&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=hpi-schul-cloud_schulcloud-server)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=hpi-schul-cloud_schulcloud-server&metric=coverage)](https://sonarcloud.io/summary/new_code?id=hpi-schul-cloud_schulcloud-server)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=hpi-schul-cloud_schulcloud-server&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=hpi-schul-cloud_schulcloud-server)
## NestJS application

> Find the [NestJS applications documentation](https://hpi-schul-cloud.github.io/schulcloud-server/additional-documentation/nestjs-application.html) of this repository at GitHub pages. It contains information about

- setup & preconditions
- starting the application
- testing
- tools setup (VSCode, Git)
- architecture

Based on [NestJS](https://docs.nestjs.com/)

## Feathers application

This is legacy part of the application!

Based on [Node.js](https://nodejs.org/en/) and [Feathers](https://feathersjs.com/)

## Application seperation

In order to seperate NestJS and Feathers each application runs in its own express instance. These express instances are then mounted on seperate paths under a common root express instance.

```
Root-Express-App 
├─ api/v1/       --> Feathers-App
├─ api/v3/       --> NestJS-App
```

This ensures that each application can run its own middleware stack for authentication, error handling, logging etc.

The mount paths don't have any impact on the routes inside of the applications, e.g. the path `/api/v3/news` will translate to the inner path `/news`. That means that in terms of route matching each child application doesn't have to take any measures regarding the path prefix. It simply works as it was mounted to `/`.

**However note** that when URLs are generated inside a child application the path prefix has to be prepended. Only then the generated URLs match the appropriate child application, e.g. the path `/news` has to be provided as the external path `/api/v3/news`.

It is possible (not very likely) that the server api is called with URLs that use the old schema without a path prefix. As a safety net for that we additionally mount the Feathers application as before under the paths:

- `/` - for internal calls
- `/api` - for external calls

When these paths are accessed an error with context `[DEPRECATED-PATH]` is logged.

## Setup

The whole application setup with all dependencies can be found in [System Architecture](https://docs.dbildungscloud.de/display/DBH/System+Architecture). It contains information about how different application components are connected to each other.

## Debugger Configuration in Visual Studio Code

For more details how to set up Visual Studio Code, read [this document](https://docs.dbildungscloud.de/display/DBH/Visual+Studio+Code+-+Beginners+Guide).

## How to name your branch and create a pull request (PR)

1. Take the Ticket Number from JIRA (ticketsystem.dbildungscloud.de), e.g. SC-999
2. Name the feature branch beginning with Ticket Number, all words separated by dash "-", e.g. `feature/SC-999-fantasy-problem`
3. Create a PR on branch develop containing the Ticket Number in PR title
4. Keep the `WIP` label as long as this PR is in development, complete PR checklist (is automatically added), keep or increase code test coverage, and pass all tests before you remove the `WIP` label. Reviewers will be added automatically.

## Committing

Default branch: `main`

1. Go into project folder
2. Checkout to develop branch (or clone for the first time)
3. Run `git pull`
4. Create a branch for your new feature named feature/BC-*Ticket-ID*-*Description*
5. Run the tests (see above)
6. Commit with a meaningful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
7. Start a pull request (see above) to branch develop to merge your changes
8. hope
