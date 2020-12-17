const chai = require('chai');
const appPromise = require('../../../src/app');

const testObjects = require('../helpers/testObjects')(appPromise);

const { expect } = chai;

const otherSchool = {
	id: '000000000000000000000002',
};

let authenticator;

const testAccess = (endpoint) => async () => {
	const app = await appPromise;
	const request = chai
		.request(app)
		.get(endpoint)
		.set('Accept', 'application/json')
		.set('content-type', 'application/x-www-form-urlencoded');
	return authenticator.authenticate(request).then((response) => {
		const { data } = response.body;
		expect(data).to.have.lengthOf(1);

		const schoolIds = data.map((d) => d.schoolId);
		expect(schoolIds).to.not.contain(otherSchool.id);
	});
};

describe('access control', () => {
	/*
	let requestingAccount;
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
