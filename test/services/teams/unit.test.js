'use strict';

const chai = require('chai');
const expect = chai.expect;

const app = require('../../../src/app');
const { setupUser, deleteUser, MockEmailService } = require('./helper');

describe('Unit Test | teams', () => {
    let server;

    before(done => {
       server = app.listen(0, done);
    });

    after(done => {
       server.close(done);
    });

    describe('Create User', () => {
        it('should be accepted for execution', () => {
            setupUser().then(({ account, user, accessToken }) => {
                console.log(account, user, accessToken);
            });
        });   
    });
});
