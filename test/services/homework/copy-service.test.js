const chai = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);
const { homeworkModel } = require('../../../src/services/homework/model');

const homeworkService = app.service('homework');
const homeworkCopyService = app.service('homework/copy');
const { expect } = chai;


describe('homework copy service', () => {
	const homeworkIdsToDelete = [];

	after(async () => {
		await homeworkModel.deleteMany({ id: { $in: homeworkIdsToDelete } });
		testObjects.cleanup();
	});

	it('copies a homework via POST', async () => {
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

		const copy = await homeworkCopyService.create({ _id: homework._id, userId: user._id });
		expect(copy.courseId).to.equal(null);
		expect(copy.lessonId).to.equal(null);
		expect(copy.name).to.equal('Testaufgabe');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});

	it('generates data for a copy on GET', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(user);
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

		const copy = await homeworkCopyService.get(homework._id, params);
		expect(copy.courseId).to.equal(null);
		expect(copy.lessonId).to.equal(null);
		expect(copy.name).to.equal('Testaufgabe - Copy');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});

	it('can only copy users own homework', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const otherUser = await testObjects.createTestUser({ roles: ['teacher'] });
		const params = await testObjects.generateRequestParamsFromUser(user);
		const homework = await testObjects.createTestHomework({
			teacherId: otherUser._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
		});
		try {
			const copy = await homeworkCopyService.create({ _id: homework._id, userId: user._id });
			homeworkIdsToDelete.push(copy._id);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.eq(403);
		}
		try {
			await homeworkCopyService.get(homework._id, params);
			throw new Error('should have failed');
		} catch (err) {
			expect(err.message).to.not.eq('should have failed');
			expect(err.code).to.eq(403);
		}
	});
});
