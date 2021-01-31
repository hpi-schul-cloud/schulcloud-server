const { expect } = require('chai');
const app = require('../../../src/app');

describe.only('grade-levels service', () => {
    let server;
    let yearsService;

    before(async () => {
        server = await app.listen();
        yearsService = app.service('gradeLevels')
    });

    after(async () => {
        await server.close();
    });

    it('should register years service', () => {
        expect(yearsService).to.be.not.null;
    });
});