# Loadtesting the boards

The socket.io documentation suggests to use the tool artillery in order to load test a socket-io tool like our board-collaboration service.

For defining scenarios you need to use/create Yaml-files that define which operations with which parameters need to be executed in which order.

Some sceneraios were already prepared and are stored in the subfolder scenarios.

## install artillery

To run artillery from your local environment you need to install it first including an adapter that supports socketio-v3-websocket communication:

```sh
npm install -g artillery artillery-engine-socketio-v3
```

## manual execution

To execute a scenario you can run artillery from the shell / commandline...:

Using the `--variables` parameter it is possible to define several variables and there values that can be used in the scenerio-yaml-file:

- **target**: defines the base url for all requests (REST and WebSocket)
  e.g. https://main.dbc.dbildungscloud.dev
- **token**: a valid JWT for the targeted system
- **board_id**: id of an existing board the tests should be executed on

```powershell
npx artillery run --variables "{'target': 'https://main.dbc.dbildungscloud.dev', 'token': 'eJ....', 'board_id': '668d0e03bf3689d12e1e86fb' }" './scenarios/3users.yml' --output artilleryreport.json
```

## visualizing the recorded results

It is possible to generate a HTML-report based on the recorded data.

```powershell
npx artillery report --output=$board_title.html artilleryreport.json
```

## automatic execution

You can run one of the existing scenarios by executing:

```bash
bash runScenario.sh
```

This will:

1. let you choose from scenario-files
2. create a fresh JWT-webtoken
3. create a fresh board (in one of the courses) the user has access to
4. name the board by a combination of datetime and the scenario name.
5. output a link to the generated board (in order open and see the test live)
6. start the execution of the scenario against this newly created board
7. generate a html report in the end

You can also provide the target as the first and the name of the scenario as the second parameter - to avoid the need to select those:

```bash
bash runScenario.sh https://bc-6854-basic-load-tests.nbc.dbildungscloud.dev 3users
```

## Open Todos:

- [x] split code into functions
- [x] suppress curl output
- [x] add proper error handling of failed requests
- [x] cleanup scenarios
- [x] write documentation for linux => runScenario.sh
- [x] write documentation for windows => direct command
- [x] replace selects with parameters from script call
- [ ] properly handle credentials - env-vars?
