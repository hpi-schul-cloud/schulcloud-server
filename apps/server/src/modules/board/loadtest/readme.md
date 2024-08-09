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
  e.g. `https://main.dbc.dbildungscloud.dev`
- **token**: a valid JWT for the targeted system
- **board_id**: id of an existing board the tests should be executed on

```bash
npx artillery run --variables "{'target': 'https://main.dbc.dbildungscloud.dev', 'token': 'eJ....', 'board_id': '668d0e03bf3689d12e1e86fb' }" './scenarios/3users.yml' --output artilleryreport.json
```

On Windows Powershell, the variables value needs to be wrapped in singlequotes, and inside the json you need to use backslash-escaped doublequotes:

```powershell
npx artillery run --variables '{\"target\": \"https://main.dbc.dbildungscloud.dev\", \"token\": \"eJ....\", \"board_id\": \"668d0e03bf3689d12e1e86fb\" }' './scenarios/3users.yml' --output artilleryreport.json
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

You can also provide the target as the first and the name of the scenario as the second parameter - to avoid the need to select those. Here is an example:

```bash
bash runScenario.sh https://bc-6854-basic-load-tests.nbc.dbildungscloud.dev 3users
```

## password

By typeing `export CARL_CORD_PASSWORD=realpassword` the script will not ask you anymore for the password to create a token.

## Todos

- [ ] enable optional parameter course_id

# New Version: Loadtesting

## provide environment variables

In order to run the load tests you need to provide three environment variables:

### target

The Url of the server.

e.g. `export target=http://localhost:4450` <br>
e.g. `export target=https://bc-7038-advanced-load-testing.brb.dbildungscloud.dev`

### courseId

The id of the course that the user (see next variable "token") is allowed to create boards in.<br>
e.g. `export courseId=66ac95068c01568a51ebf224`

### token

A valid JWT-token of a user that is allowed to create boards in the given course. <br>
e.g. `export token=eyJhbGciOiJIUzI1NiIsInR5cCI6Im...`

## Todos

Aussage treffen:

- Was schafft ein Pod?
- Was schafft ein Pod mit welcher Leistung? ()

ideas for joining users of one board on the same websocket-server

- how to make routing via added request attribute work over ingress
- service for registering which room on which node
- clients tries to reconnect until the server-response tells him he is one the right server for the board
- ziel-pod connects himself with different websocket via websocket-connection

Erkenntnis: Mehr pods schaffen auch eine schnellere Verarbeitung der Requests

### hypothese 1: der load-generator ist der engpass, weil er nicht genug requests schafft

- lösungsansatz 1: mehrere childprocess über cluster funktion... keine Lösung
- lösungsansatz 2: mehrere parallele node aufrufe aus der shell heraus

### hypothese 2: es gibt ein timing-problem, zwischen request und response und dabei gehen responses verloren, die aber werden aber erwartet und der verlust führt zu Timeouts

- lösungsansatz: das waitSuccess schon vor dem request auf den socket verknüpfen...
  ergebnis: hat das Problem nicht behoben

### hypothese 3: das verknüpfen und entfernen von listenern auf das jeweilige event verursacht zu viel overhead

lösungsansatz 3: alle hereinkommenden events werden gespeichert und waitSuccess erhält noch einen zeitstempel nachdem das event hereingekommen sein muss... das erste event das matcht wird returnt

### hypothese 4: die anzahl der sockets ist reduziert und deshalb klappt das nicht

nein: 900 connections = 30 \* 300 dürften kein Problem sein... frühestens ab 2048 könnte es mit soetwas zu tun haben

### hypothese 5: ich müsste gezielt auf failures hören... ggf. ist auch im server ein problem

das problem ist das ausbleiben von success-meldungen

[ ] ausprobieren: rückschwenk auf redis-adapter ausprobieren
