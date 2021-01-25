import {Application} from "@feathersjs/express";
import {GroupProxyService, UsersProxyService} from "./service";
import {setHttpStatusCode} from "./service/hooks/setHttpStatusCode";
import {baseUrlApi} from "../../environment";
import { registerApiValidation } from "../../utils/apiValidation";
import * as path from "path";
const { static: staticContent } = require('@feathersjs/express');


// setup services and REST API
// REST handlers are setup implicitly via feathersJS
module.exports = function syncApi(app: Application) {
    // Register API Validation
    registerApiValidation(app, path.join(__dirname, '/docs/openapi.yaml'));
    app.use(`${baseUrlApi}/api`, staticContent(path.join(__dirname, '/docs/openapi.yaml')));

    app.use(`${baseUrlApi}/users`, new UsersProxyService(app))
    app.use(`${baseUrlApi}/groups`, new GroupProxyService(app))
    app.service(`${baseUrlApi}/groups`).hooks({
        after: {
            remove: [setHttpStatusCode(204)]
        }
    })
    app.get(`${baseUrlApi}/groups/:groupId/members`, (req, res) => new GroupProxyService(app).handleGetGroupMembers(req, res))
    app.post(`${baseUrlApi}/groups/:groupId/members`, (req, res) => new GroupProxyService(app).handlePostGroupMember(req, res));

    app.delete(`${baseUrlApi}/groups/:groupId/members/:memberId`, (req, res) => new GroupProxyService(app).handleDeleteGroupMember(req, res))
}
