const { expect } = require('chai');

describe('\'/teams/manage/admin\' service', () => {
    it('registered the service', () => {
        const service = app.service('/teams/manage/admin');
    
        assert.ok(service, 'Registered the service');
    });

    it('teams find', async () => {
        
    });
});