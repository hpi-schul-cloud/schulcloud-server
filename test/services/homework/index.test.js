const assert = require('assert');
const chai = require('chai');
const app = require('../../../src/app');

const homeworkService = app.service('homework');
const homeworkCopyService = app.service('homework/copy');
const { expect } = chai;


describe('homework service', function test() {
	this.timeout(10000);

	it('registered the homework service', () => {
		assert.ok(homeworkService);
		assert.ok(homeworkCopyService);
	});

	const testAufgabe = {
		schoolId: '0000d186816abba584714c5f',
		teacherId: '0000d231816abba584714c9e',
		name: 'Testaufgabe',
		description: '\u003cp\u003eAufgabenbeschreibung\u003c/p\u003e\r\n',
		availableDate: '2017-09-28T11:47:46.622Z',
		dueDate: '2030-11-16T12:47:00.000Z',
		private: true,
		archived: ['0000d231816abba584714c9e'],
		lessonId: null,
		courseId: null,
		updatedAt: '2017-09-28T11:47:46.648Z',
		createdAt: '2017-09-28T11:47:46.648Z',
	};
	it('CREATE task', () => {
		homeworkService.create(testAufgabe)
			.then((result) => {
				expect(result.name).to.equal('Testaufgabe');
			});
	});
	it('DELETE task', () => homeworkService.find({
		query: { name: 'Testaufgabe' },
		account: { userId: '0000d231816abba584714c9e' },
	}).then((result) => {
		expect(result.data.length).to.be.above(0);
		return homeworkService.remove(result.data[0]._id)
			.then(() => true);
	}));

	// PERMISSION TESTS
	it('FIND only my own tasks', () => homeworkService.find({
		query: {},
		account: { userId: '0000d231816abba584714c9e' },
	}).then((result) => {
		expect(result.total).to.be.above(0);
		expect(result.data.filter((e) => String(e.teacherId) !== '0000d231816abba584714c9e').length).to.equal(0);
	}));

	it('try to FIND tasks of others', () => homeworkService.find({
		query: {
			teacherId: '0000d224816abba584714c9c',
			private: true,
		},
		account: { userId: '0000d231816abba584714c9e' },
	}).then((result) => {
		expect(result.total).to.equal(0);
	}));

	it('contains statistics as a teacher', () => homeworkService.find({
		query: { _id: '59d1f63ce0a06325e8b5288b' },
		account: { userId: '0000d231816abba584714c9e' },
	}).then((result) => {
		expect(result.data[0].stats.userCount).to.equal(2);
		expect(result.data[0].stats.submissionCount).to.equal(1);
		expect(result.data[0].stats.submissionPercentage).to.equal('50.00');
		expect(result.data[0].stats.gradeCount).to.equal(1);
		expect(result.data[0].stats.gradePercentage).to.equal('50.00');
		expect(result.data[0].stats.averageGrade).to.equal('67.00');
		// no grade as a teacher
		expect(result.data[0].grade).to.equal(undefined);
	}));
	it('contains grade as a student', () => homeworkService.find({
		query: { _id: '59d1f63ce0a06325e8b5288b' },
		account: { userId: '0000d224816abba584714c9c' },
	}).then((result) => {
		expect(result.data[0].grade).to.not.equal('67.00');
		// no stats as a student
		expect(result.data[0].stats).to.equal(undefined);
	}));
	it('contains statistics as students when publicSubmissions:true', () => homeworkService.find({
		query: { _id: '59d1fae6395c8218f82cb914' },
		account: { userId: '0000d224816abba584714c9c' },
	}).then((result) => {
		expect(result.data[0].grade).to.not.equal('67.00');
		// no stats as a student
		expect(result.data[0].stats).to.not.equal(undefined);
	}));
});
