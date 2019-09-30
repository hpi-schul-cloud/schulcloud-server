const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);
const { generateRequestParamsFromUser } = require('../../helpers/services/login')(app);

const courseMembersService = app.service('/courses/:scopeId/members');

describe('course scope members service', () => {
	it('is properly registered', () => {
		expect(courseMembersService).to.not.equal(undefined);
	});

	describe('returns all members', () => {
		it('in small courses', async () => {
			const user = await testObjects.createTestUser();
			const activeCourse = await testObjects.createTestCourse({
				userIds: [user._id],
			});
			const response = await courseMembersService.find({ route: { scopeId: activeCourse._id } });
			expect(Object.keys(response)).to.deep.equal([user._id.toString()]);
		});
	});

	afterEach(testObjects.cleanup);
});
