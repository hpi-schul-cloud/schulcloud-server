const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');
const testObjects = require('../helpers/testObjects')(app);

const homeworkService = app.service('homework');
const homeworkCopyService = app.service('homework/copy');
const { expect } = chai;


describe('homework service', function test() {
	this.timeout(10000);

	it('copies a homework via POST', async () => {
		const user = await testObjects.createTestUser({ roles: ['teacher'] });
		const homework = await homeworkService.create({
			schoolId: '0000d186816abba584714c5f',
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
			updatedAt: '2017-09-28T11:47:46.648Z',
			createdAt: '2017-09-28T11:47:46.648Z',
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
		const homework = await homeworkService.create({
			schoolId: '0000d186816abba584714c5f',
			teacherId: user._id,
			name: 'Testaufgabe',
			description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
			availableDate: Date.now(),
			dueDate: '2030-11-16T12:47:00.000Z',
			private: true,
			archived: [user._id],
			lessonId: null,
			courseId: null,
			updatedAt: '2017-09-28T11:47:46.648Z',
			createdAt: '2017-09-28T11:47:46.648Z',
		});

		const copy = await homeworkCopyService.get(homework._id, params);
		expect(copy.courseId).to.equal(null);
		expect(copy.lessonId).to.equal(null);
		expect(copy.name).to.equal('Testaufgabe - Copy');
		expect(copy.stats).to.equal(undefined);
		expect(copy.grade).to.equal(undefined);
	});
});
