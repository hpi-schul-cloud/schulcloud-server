# Technical TODO around Nest Introduction

## SUGGESTED

- disable Document from window

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
