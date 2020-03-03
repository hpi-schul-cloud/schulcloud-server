const chai = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { homeworkModel } = require('../../../src/services/homework/model');

const homeworkShareService = app.service('homework/share');
const { expect } = chai;


describe('homework share service', () => {
	const homeworkIdsToDelete = [];

	after(async () => {
		await homeworkModel.deleteMany({ id: { $in: homeworkIdsToDelete } });
	});

	it('can create a sharetoken', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});
		const res = await homeworkShareService.get(homework._id.toString());
		expect(res.shareToken).to.not.be.undefined;
		expect(typeof res.shareToken).to.eq('string');
	});

	it('user can create a sharetoken for his homework', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await testObjects.createTestHomework({
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});
		const params = await testObjects.generateRequestParamsFromUser(user);
		const res = await homeworkShareService.get(homework._id.toString(), params);
		expect(res.shareToken).to.not.be.undefined;
		expect(typeof res.shareToken).to.eq('string');
	});

	it('user can use his own sharetoken');
	it('user on the same school can use sharetoken');
	it('user on different school can use sharetoken');
});
