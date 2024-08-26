# Loadtesting the boards

The tests can be run from your local environment or from any other place that has the code and installed dependencies.

## provide environment variables

In order to run the load tests you need to provide three environment variables:

### target

The Url of the server.

e.g. `export TARGET_URL=http://localhost:4450` <br>
e.g. `export TARGET_URL=https://bc-7830-board-loadtests-merge.brb.dbildungscloud.dev`

### courseId

The id of the course that the user (see next variable "token") is allowed to create boards in.<br>
e.g. `export COURSE_ID=66c493f577499cc64bf9aab4`

### token

A valid JWT-token of a user that is allowed to create boards in the given course. <br>
e.g. `export TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6...`

## run connection test

This test is only trying to establish the defined amount of connections. It is useful to find out about any problems with larger amounts of connections.

To run the test:

```bash
npx jest apps/server/src/modules/board/loadtest/connection.load.spec.ts
```

## run board-collaboration test

This test emulates multiple class settings (defined here: class-definitions.ts).
By default there are 20 viewer classes emulated (consisting of one fastEditor (teacher) and thirty viewers (students)).
There is also the definition of a collaboration class (constisting of 30 fastEditors). By default no collaboration-class is emulated.
The editors create columns, cards, texts, links etc. For each class we have a separate board that is automatically created at the beginning of the testrun.
At the end of the test you will see a summary in the bash - which is also written into a json file. This is helpful when comparing execution times (visible in grafana) with response times and the actual setting that was run.

**Hint 1**: the amount of classes can be overruled via two environment variables:
VIEWER_CLASSES and COLLAB_CLASSES).

**Hint 2**: to modifiy what a viewerClass is - you can also manipulate the settings in class-definition.ts.

To run the test:

```bash
npx jest apps/server/src/modules/board/loadtest/board-collaboration.load.spec.ts
```
