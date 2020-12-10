const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { withApp, testObjects, appPromise } = require('../../../../test/utils/withApp.test');
const { createLessonContents } = require('../../../../test/services/helpers/services')(appPromise).lessons;
const { equal, toString: idToString } = require('../../../helper/compare').ObjectId;
const { deleteUserData } = require('./deleteUserData.uc');
const { ApplicationError } = require('../../../errors');

const { expect } = chai;
chai.use(chaiAsPromised);

const simulateOrchestratedDeletion = (userId) => {
	return Promise.all(
		deleteUserData().map((step) => {
			return step(userId);
		})
	);
};

// TODO mock the repositoriy calls

describe(
	'when removing user data from course component',
	withApp(async () => {
		describe('remove data from courses', () => {
			it('should validate params');
		});
		describe('remove data from lesson contents', () => {});
		describe('remove data from course groups', () => {});
	})
);
