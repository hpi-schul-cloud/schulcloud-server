const { expect } = require('chai');
const app = require('../../../src/app');

describe.only('school-group service', () => {
    let server;
    let schoolGroupService;

    before(async () => {
        server = await app.listen();
        schoolGroupService = app.service('schoolGroup')
    });

    after(async () => {
        await server.close();
    });

    it('should register school-group service', () => {
        expect(schoolGroupService).to.be.not.null;
    });
});