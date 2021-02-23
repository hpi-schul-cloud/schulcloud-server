/*
debug config example
        {
            "request": "launch",
            "internalConsoleOptions": "openOnSessionStart",
            "name": "Debug Migrations",
            "runtimeExecutable": "node",
            "runtimeArgs": [
                "./migrations/index.js"
            ],
            "skipFiles": [
                "<node_internals>/**"
            ],
            "type": "pwa-node",
        }
*/

const migration = require('./1613348381637-replaceFileLinks');

migration.up();
