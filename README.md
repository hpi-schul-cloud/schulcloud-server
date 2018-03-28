# Schul-Cloud Server
Based on [Node.js](https://nodejs.org/en/) and [Feathers](https://feathersjs.com/)

Dev: ![Travis Status](https://travis-ci.org/schul-cloud/schulcloud-server.svg?branch=master)
Production: ![Travis Status](https://travis-ci.org/schul-cloud/schulcloud-server.svg?branch=production)

[![Code Coverage](https://img.shields.io/codecov/c/github/schul-cloud/schulcloud-server/master.svg)](https://codecov.io/github/schulcloud/schulcloud-server?branch=master)
[![Version](https://img.shields.io/github/release/schul-cloud/schulcloud-server.svg)](https://github.com/schulcloud/schulcloud-server/releases)

Swagger UI documentation is available [here](https://schul-cloud.org:8080/docs/).
When running the server locally, it is served at [http://localhost:3030/docs/](http://localhost:3030/docs/).
# Requirements

* node.js
* mongoDB

## Setup

There are blog posts on how to setup [client](https://github.com/schul-cloud/schulcloud-client) and [server](https://github.com/schul-cloud/schulcloud-server) under [Windows](https://schul-cloud.github.io/blog/2017-05-18/setup-schul-cloud-client-and-sever-under-windows) and [Linux](https://schul-cloud.github.io/blog/2017-04-21/setup-development-under-ubuntu).


1. Clone directory into local folder
2. Go into the cloned folder and enter `npm install`

## Run

1. Go into project folder
2. run `mongod`
2. run `npm start`
3. run `npm run setup`

## Run with Debug in Visual Studio Code

#Change in launch.json
```
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch SC-Server",
            "program": "${workspaceFolder}/src/index.js",
            "skipFiles": [
              "<node_internals>/**"
            ]

        }
    ]
}
```

## Run with docker

1. Go into project folder
2. run `docker-compose up`

## How to name your branch

1. Take the last part of the url of your Trello ticket (e.g. "8-setup-feather-js")
2. Name the branch "yourname/trelloid" (e.g. "nico/8-setup-feather-js")

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
