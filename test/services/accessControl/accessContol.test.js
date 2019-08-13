const assert = require('assert');
const mongoose = require('mongoose');
const app = require('../../../src/app');

const userService = app.service('users');
const chai = require('chai');
const loginHelper = require('./../helpers/login');
const testObjects = require('./../helpers/testObjects')(app);
const _ = require('lodash');

const { expect } = chai;

const testCredentials = {
	username: 'testuser@school-of-tests.schul-cloud.org',
	password: 'passwordA',
};

const ownSchool = {
	id: '000000000000000000538001',
};

const otherSchool = {
	id: '000000000000000000000002',
};

let authenticator;

const testAccess = endpoint => () => {
	const request = chai.request(app)
		.get(endpoint)
		.set('Accept', 'application/json')
		.set('content-type', 'application/x-www-form-urlencoded');
	return authenticator.authenticate(request)
		.then((response) => {
			const { data } = response.body;
			expect(data).to.have.lengthOf(1);

			const schoolIds = data.map(d => d.schoolId);
			expect(schoolIds).to.not.contain(otherSchool.id);
		});
};

describe('access control', () => {
	let requestingAccount;
	/*
    before(() => {
        return Promise.all([
            //testObjects.createTestSystem({type: null}),
            testObjects.createTestUser({schoolId: ownSchool.id}),
            testObjects.createTestUser({schoolId: otherSchool.id}),
            testObjects.createTestClass({schoolId: ownSchool.id}),
            testObjects.createTestClass({schoolId: otherSchool.id}),
            testObjects.createTestCourse({schoolId: ownSchool.id}),
            testObjects.createTestCourse({schoolId: otherSchool.id}),
        ]).then(([requester, otherUser]) => {
            return testObjects.createTestAccount(_.cloneDeep(testCredentials), null, requester);
        })
            .then(reqAccount => {
                requestingAccount = reqAccount;
                return loginHelper.authenticateWithCredentials(testCredentials);
            })
            .then(_authenticator => {
                authenticator = _authenticator;
            });
    });
    */

	it.skip('shows only users who belong to the same school as the requester', testAccess('/users'));
	it.skip('shows only courses who belong to the same school as the requester', testAccess('/courses'));
	it.skip('shows only classes who belong to the same school as the requester', testAccess('/classes'));

	after(() => {
		testObjects.cleanup();
	});
});
