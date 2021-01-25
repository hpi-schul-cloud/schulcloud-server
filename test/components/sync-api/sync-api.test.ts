describe('Sync API', () => {
    let app;
    let server;
    let userProxyService;
    let groupProxyService;

    const assert = require('assert');
    const {expect} = require('chai');
    const appPromise = require('../../../src/app');
    const testObjects = require('../../services/helpers/testObjects')(appPromise);


    before(async () => {
        app = await appPromise;
        userProxyService = app.service(`/syncapi/v1/users`);
        groupProxyService = app.service(`/syncapi/v1/groups`);
        server = await app.listen(0);
    });

    after((done) => {
        done();
    })

    it('registered user proxy service and group proxy service', () => {
        assert.ok(userProxyService);
        assert.ok(groupProxyService);
    })
})
