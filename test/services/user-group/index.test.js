const { expect } = require('chai');
const logger = require('winston');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const classesService = app.service('/classes');

describe('user-group service', () => {
	it('is properly registeredregistered the users service', () => {
		expect(classesService).to.not.equal(undefined);
	});

	it('sorts classes correctly', async () => {
		const teacher = await testObjects.createTestUser({ roles: ['teacher'] });
		await testObjects.createTestClass({
			name: 'a',
		}).catch((err) => {
			logger.warn('Can not create test class.', err);
		});
		await testObjects.createTestClass({
			name: 'B',
		}).catch((err) => {
			logger.warn('Can not create test class.', err);
		});

		const params = {
			account: {
				userId: teacher._id,
			},
			query: {
				$sort: {
					displayName: -1,
				},
			},
		};

		const result = await classesService.find(params);
		const classes = result.data;
		expect(classes).to.not.be.undefined;
		expect(classes[0].displayName).to.be.greaterThan(classes[1].displayName);
	});

	after(async () => {
		await testObjects.cleanup();
	});
});
