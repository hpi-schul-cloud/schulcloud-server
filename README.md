# Schul-Cloud Server
Based on [Node.js](https://nodejs.org/en/) and [Feathers](https://feathersjs.com/)

Dev: [![Build Status](https://travis-ci.com/schul-cloud/schulcloud-server.svg?branch=master)](https://travis-ci.com/schul-cloud/schulcloud-server)
Production: [![Build Status](https://travis-ci.com/schul-cloud/schulcloud-server.svg?branch=production)](https://travis-ci.com/schul-cloud/schulcloud-server)

[![Code Coverage](https://img.shields.io/codecov/c/github/schul-cloud/schulcloud-server/master.svg)](https://codecov.io/github/schulcloud/schulcloud-server?branch=master)
[![Version](https://img.shields.io/github/release/schul-cloud/schulcloud-server.svg)](https://github.com/schulcloud/schulcloud-server/releases)

Swagger UI documentation is available [here](https://schul-cloud.org:8080/docs/).
When running the server locally, it is served at [http://localhost:3030/docs/](http://localhost:3030/docs/).


# Requirements

* node.js
* mongoDB


## Setup

You will need the [client](https://github.com/schul-cloud/schulcloud-client) as well. For more detailed setup instructions, take a look [here](https://docs.schul-cloud.org/display/SCDOK/Setup). It is written for Windows but the procedure is similar for other OS.


## Run

1. Go into project folder
2. run `mongod`
2. run `npm start`
3. run `npm run setup`


## Debugger Configuration in Visual Studio Code

For more details how to set up Visual Studio Code, read [this document](https://docs.schul-cloud.org/display/SCDOK/Visual+Studio+Code).

## How to name your branch  
  
1. Take the Ticket Number from JIRA (ticketsystem.schul-cloud.org), e.g. SC-999  
2. Name the branch beginning with Ticket Number, all words separated by dash "-", e.g. `SC-999-fantasy-problem`
3. Create a PR containing the Ticket Number in PR title
4. Add the `[WIP]` label as long as this PR is in development, remove label and request reviewers if you are done and Definition of Done (will get added here later on) are met.

## Testing

### Run tests

1. Go into project folder
2. run `npm run test`

### Create tests

1. Create a folder for the "service" you're working on in "/test/services"
2. Create a file "user.test.js" for frontend tests (e.g. clicking a link or check if url is available)
3. Create a file "unit.test.js" for backend tests (e.g. calculating a number)

*Try to cover as many methods as possible unit test wise - goal is 100% of course, so one test per method.*

## Commiting

Default branch: develop

1. Go into project folder
2. Run the tests (see above)
3. Commit with a meanigful commit message(!) even at 4 a.m. and not stuff like "dfsdfsf"
4. Checkout to master branch
5. Run `git pull`
6. Checkout to the branch you want to upload
7. run `git rebase -p develop` (not `git merge`!) and solve merge conflicts if needed
8. run `git push`
