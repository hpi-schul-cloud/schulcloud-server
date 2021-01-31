const { expect } = require('chai');
const app = require('../../../src/app');

describe.only('years service', () => {
    let server;
    let yearsService;

    before(async () => {
        server = await app.listen();
        yearsService = app.service('years')
    });

    after(async () => {
        await server.close();
    });

    it('should register years service', () => {
        expect(yearsService).to.be.not.null;
    });
});