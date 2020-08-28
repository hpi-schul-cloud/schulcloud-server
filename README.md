# Schul-Cloud Server

Based on [Node.js](https://nodejs.org/en/) and [Feathers](https://feathersjs.com/)

Dev: [![Build Status](https://travis-ci.com/schul-cloud/schulcloud-server.svg?branch=develop)](https://travis-ci.com/schul-cloud/schulcloud-server)
Master: [![Build Status](https://travis-ci.com/schul-cloud/schulcloud-server.svg?branch=master)](https://travis-ci.com/schul-cloud/schulcloud-server)

Dev: [![codecov](https://codecov.io/gh/schul-cloud/schulcloud-server/branch/develop/graph/badge.svg)](https://codecov.io/gh/schul-cloud/schulcloud-server/branch/develop)
Master: [![codecov](https://codecov.io/gh/schul-cloud/schulcloud-server/branch/master/graph/badge.svg)](https://codecov.io/gh/schul-cloud/schulcloud-server)

Codacy: [![Codacy Badge](https://api.codacy.com/project/badge/Grade/b5a3d19c5ec640749b167dafb02e2648)](https://www.codacy.com/manual/schul-cloud/schulcloud-server?utm_source=github.com&utm_medium=referral&utm_content=schul-cloud/schulcloud-server&utm_campaign=Badge_Grade) [![Codacy Badge](https://api.codacy.com/project/badge/Coverage/b5a3d19c5ec640749b167dafb02e2648)](https://www.codacy.com/manual/schul-cloud/schulcloud-server?utm_source=github.com&utm_medium=referral&utm_content=schul-cloud/schulcloud-server&utm_campaign=Badge_Coverage)

[![Version](https://img.shields.io/github/release/schul-cloud/schulcloud-server.svg)](https://github.com/schulcloud/schulcloud-server/releases)
[![Greenkeeper badge](https://badges.greenkeeper.io/schul-cloud/schulcloud-server.svg)](https://greenkeeper.io/)

OpenAPI specifications are available [here](https://schul-cloud.org:8080/docs/).
When running the server locally, the specifications are served per service at [http://localhost:3030/<servicename>/api/openapi.yaml](http://localhost:3030/<servicename>/api/openapi.yaml).

# Requirements

* Node.js (see `.nvmrc` for version)
* MongoDB (`4.x`)

## Setup

You will need the [client](https://github.com/schul-cloud/schulcloud-client) as well. For more detailed setup instructions, take a look [here](https://docs.schul-cloud.org/display/SCDOK/Setup). It is written for Windows but the procedure is similar for other OS.

## Run

1. Go into project folder
2. Run `mongod`
3. Run `npm start`
4. Run `npm run setup`

## Debugger Configuration in Visual Studio Code

For more details how to set up Visual Studio Code, read [this document](https://docs.schul-cloud.org/display/SCDOK/Visual+Studio+Code).

## How to name your branch and create a pull request (PR)

1. Take the Ticket Number from JIRA (ticketsystem.schul-cloud.org), e.g. SC-999
2. Name the feature branch beginning with Ticket Number, all words separated by dash "-", e.g. `feature/SC-999-fantasy-problem`
3. Create a PR on branch develop containing the Ticket Number in PR title
4. Keep the `WIP` label as long as this PR is in development, complete PR checklist (is automatically added), keep or increase code test coverage, and pass all tests before you remove the `WIP` label. Reviewers will be added automatically. For more information check our Definition of Done [here](https://docs.schul-cloud.org/pages/viewpage.action?pageId=92831762).

## Testing

### Run tests

1. Go into project folder
2. run `npm run test`

To run a single test, use `npm run mocha-single -- <path/to/unit.test.js>`.

### Create tests

1. Create a folder for the "service" you're working on in "/test/services"
2. Create a file "user.test.js" for frontend tests (e.g. clicking a link or check if URL is available)
3. Create a file "unit.test.js" for backend tests (e.g. calculating a number)

*Try to cover as many methods as possible unit test wise - goal is 100% of course, so one test per method.*

## Committing

Default branch: develop

1. Go into project folder
2. Checkout to develop branch (or clone for the first time)
3. Run `git pull`
4. Create a branch for your new feature named feature/SC-*Ticket-ID*-*Description*
5. Run the tests (see above)
6. Commit with a meaningful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
7. Start a pull request (see above) to branch develop to merge your changes
